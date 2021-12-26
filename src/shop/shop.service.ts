import {Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Shop, ShopDocument} from "./models/shop.schema";
import {Model, Query, UpdateWriteOpResult} from "mongoose";
import {IShop} from "shopify-api-node";
import {HttpService} from "@nestjs/axios";
import {from, Observable, switchMap} from "rxjs";
import {AxiosResponse} from "axios";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class ShopService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(Shop.name) private readonly shopModel: Model<ShopDocument>,
  ) {
  }

  fetchAndStoreShopJson(shop: string, accessToken: string): Observable<UpdateWriteOpResult> {
    return this.fetchShopJson(shop, accessToken)
      .pipe(
        switchMap(({data: {shop}}) => {
          return from(this.create(shop).exec());
        })
      )
  }


  private fetchShopJson(shop: string, accessToken: string): Observable<AxiosResponse<{ shop: IShop }>> {
    return this.httpService
      .get<{ shop: IShop }>(`https://${shop}/admin/api/${this.configService.get('API_VERSION')}/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      })
  }

  private create(shop: IShop): Query<UpdateWriteOpResult, ShopDocument & { _id: (ShopDocument)["_id"] }, {}, ShopDocument> {
    return this.shopModel.updateOne(
      {name: shop.name},
      {name: shop.name, data: shop},
      {upsert: true},
    )
  }
}
