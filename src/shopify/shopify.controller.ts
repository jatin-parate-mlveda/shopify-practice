import {
  Controller,
  Get,
  InternalServerErrorException,
  Next,
  Query,
  Req,
  Res,
  UnauthorizedException
} from '@nestjs/common';
import {NextFunction, Request, Response} from "express";
import {ConfigService} from "@nestjs/config";
import {randomBytes} from 'crypto'
import {URL} from "url";
import {ShopifyService} from "./shopify.service";
import {catchError, map, throwError} from "rxjs";

@Controller('shopify')
export class ShopifyController {
  constructor(private readonly configService: ConfigService, private readonly shopifyService: ShopifyService) {
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
    // redirectUri.searchParams.set('grant_options[]', 'per-user');

    res.cookie('state', nonce);

    res.redirect(redirectUri.toString());
  }

  @Get('/callback')
  async authCallback(
    @Req() req: Request & { rawBody: string },
    @Next() next: NextFunction,
    @Query('shop') shop: string,
    @Query('hmac') hmac: string,
    @Query('code') code: string,
    @Query() query: Record<string, string>,
    @Query('state') state?: string,
  ) {
    try {
      if (!state || !req.cookies.state || state !== req.cookies.state) {
        return next(new UnauthorizedException('Invalid nonce!'));
      }

      let hashEquals: boolean;

      try {
        const generatedHash = ShopifyService.getHmacHash(
          this.configService.get<string>('API_SECRET'),
          ShopifyService.generateKvp(query),
        );

        hashEquals = generatedHash === hmac.toUpperCase();
      } catch {
        hashEquals = false;
      }

      if (!hashEquals) {
        return next(new UnauthorizedException('Hmac validation failed'));
      }

      return this.shopifyService.generateOauthToken(shop, code)
        .pipe(map(result => {
          return result.data;
        }), catchError(err => {
          console.error(err);
          return throwError(() => new InternalServerErrorException());
        }));
    } catch (err) {
      throw new InternalServerErrorException(err.response?.body ?? err.message);
    }
  }
}
