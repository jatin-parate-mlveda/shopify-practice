import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Next,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {NextFunction, Request, Response} from "express";
import {ConfigService} from "@nestjs/config";
import {randomBytes} from 'crypto'
import {URL} from "url";
import {ShopifyService} from "./shopify.service";
import {from, map, of, switchMap} from "rxjs";
import {AccessTokenService} from "../access-token/access-token.service";
import {ShopService} from "../shop/shop.service";

@Controller('')
export class ShopifyController {
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly shopifyService: ShopifyService,
    private readonly shopService: ShopService,
    private readonly accessTokenService: AccessTokenService,
  ) {
    this.logger = new Logger(ShopifyController.name);
  }

  @Get('/request')
  async authRequest(@Query('shop') shop: string, @Res({passthrough: true}) res: Response) {
    const nonce = randomBytes(10).toString('base64');
    const redirectUri = new URL(`https://${shop}/admin/oauth/authorize`);
    const shopifyRedirectUri = new URL('/shopify/callback', this.configService.get<string>('HOST'));

    redirectUri.searchParams.set('client_id', this.configService.get<string>('API_KEY'));
    redirectUri.searchParams.set('scope', this.configService.get<string>('SCOPES'));
    redirectUri.searchParams.set('redirect_uri', shopifyRedirectUri.toString());
    redirectUri.searchParams.set('state', nonce);
    // redirectUri.searchParams.set('grant_options[]', 'per-user'); // for online auth token

    res.cookie('state', nonce);

    res.redirect(redirectUri.toString());
  }

  @Get('/callback')
  authCallback(
    @Req() req: Request,
    @Res({passthrough: true}) res: Response,
    @Next() next: NextFunction,
    @Query() query: Record<string, string>,
  ) {
    try {
      const {shop, hmac, code, state} = query;
      if (!state || !req.cookies.state || state !== req.cookies.state) {
        return next(new UnauthorizedException('Invalid nonce!'));
      }

      res.clearCookie('state');

      let hashEquals: boolean;

      try {
        hashEquals = this.shopifyService.isGeneratedHashEqualsHash(hmac, query);
      } catch {
        hashEquals = false;
      }

      if (!hashEquals) {
        return next(new UnauthorizedException('Hmac validation failed'));
      }

      return from(this.accessTokenService.getByShop(shop))
        .pipe(
          switchMap(accessToken => {
            if (accessToken) {
              return of({msg: 'Shop already exists'})
            }

            return this.accessTokenService.generateAndStoreAccessToken(shop, code)
              .pipe(
                switchMap(token => this.shopService.fetchAndStoreShopJson(shop, token)),
                map(() => ({message: 'Successfully authenticated', shop}))
              );
          }),
        );
    } catch (err) {
      this.logger.error(`in: ${ShopifyController.name}`, err.stack, {
        shop: query.shop,
      });
      throw new InternalServerErrorException(err.response?.body ?? err.message);
    }
  };
}
