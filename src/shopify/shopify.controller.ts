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
    redirectUri.searchParams.set('grant_options[]', 'per-user');

    res.cookie('state', nonce);

    res.redirect(redirectUri.toString());
  }

  @Get('/callback')
  async authCallback(
    @Req() req: Request & { rawBody: string },
    @Next() next: NextFunction,
    @Query('shop') shop: string,
    // @Query('hmac') hmac: string,
    @Query('code') code: string,
    // @Query('timestamp') timestamp?: string,
    @Query('state') state?: string,
  ) {
    try {
      if (!state || !req.cookies.state || state !== req.cookies.state) {
        return next(new UnauthorizedException('Invalid nonce!'));
      }

      const res = await this.shopifyService.generateOauthToken(shop, code).toPromise();
      return res.data;
    } catch (err) {
      console.error(err, err.response?.body);
      throw new InternalServerErrorException();
    }
  }
}
