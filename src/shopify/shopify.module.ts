import {Module} from '@nestjs/common';
import {ShopifyController} from './shopify.controller';
import {HttpModule} from "@nestjs/axios";
import {ShopifyService} from './shopify.service';
import {MongooseModule} from "@nestjs/mongoose";
import {AccessToken, AccessTokenSchema} from "./models/access-token.schema";

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      {
        name: AccessToken.name,
        collection: 'access_tokens',
        schema: AccessTokenSchema,
      }
    ])
  ],
  controllers: [ShopifyController],
  providers: [ShopifyService]
})
export class ShopifyModule {
}
