import {Module} from '@nestjs/common';
import {ShopifyController} from './shopify.controller';
import {HttpModule} from "@nestjs/axios";
import {ShopifyService} from './shopify.service';

@Module({
  imports: [HttpModule],
  controllers: [ShopifyController],
  providers: [ShopifyService]
})
export class ShopifyModule {
}
