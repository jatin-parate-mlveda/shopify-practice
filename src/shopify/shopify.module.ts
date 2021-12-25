import {Module} from '@nestjs/common';
import {ShopifyController} from './shopify.controller';
import {HttpModule} from "@nestjs/axios";
import {ShopifyService} from './shopify.service';
import {MongooseModule} from "@nestjs/mongoose";
import {AccessToken, AccessTokenSchema} from "../access-token/models/access-token.schema";
import {ShopModule} from "../shop/shop.module";
import {AccessTokenModule} from "../access-token/access-token.module";

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      {
        name: AccessToken.name,
        collection: 'access_tokens',
        schema: AccessTokenSchema,
      }
    ]),
    ShopModule,
    AccessTokenModule,
  ],
  controllers: [ShopifyController],
  providers: [ShopifyService]
})
export class ShopifyModule {
}
