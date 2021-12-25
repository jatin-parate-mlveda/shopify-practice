import {Module} from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {Shop, ShopSchema} from "./models/shop.schema";
import {ShopService} from './shop.service';
import {HttpModule} from "@nestjs/axios";

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      {
        collection: 'shops',
        name: Shop.name,
        schema: ShopSchema,
      }
    ])
  ],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {
}
