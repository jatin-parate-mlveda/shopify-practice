import {Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Shop, ShopDocument} from "./models/shop.schema";
import {Model, UpdateWriteOpResult} from "mongoose";
import {IShop} from "shopify-api-node";
import {HttpService} from "@nestjs/axios";
import {catchError, from, Observable, switchMap} from "rxjs";
import {AxiosResponse} from "axios";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class ShopService {
  private logger = new Logger(ShopService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(Shop.name) private readonly shopModel: Model<ShopDocument>,
  ) {
  }

  fetchAndStoreShopJson(shop: string, accessToken: string): Observable<UpdateWriteOpResult> {
    try {
      return this.fetchShopJson(shop, accessToken)
        .pipe(
          switchMap(({data: {shop}}) => {
            return from(this.getQueryToCreate(shop).lean().exec())
              .pipe(
                catchError(err => {
                  this.logger.error(
                    `Error while storing shop json in ${ShopService.prototype.fetchAndStoreShopJson.name}`,
                    err.stack,
                    {
                      shop
                    }
                  );
                  throw new InternalServerErrorException(`Error creating storing shop json`)
                })
              )
          })
        )
    } catch (err) {
      this.logger.error(
        `Error while fetching shop json in ${ShopService.prototype.fetchAndStoreShopJson.name}`,
        err.stack,
        {
          shop,
        },
      );
      throw new InternalServerErrorException(`Error fetching and storing shop json`)
    }
  }


  private fetchShopJson(shop: string, accessToken: string): Observable<AxiosResponse<{ shop: IShop }>> {
    try {
      return this.httpService
        .get<{ shop: IShop }>(`https://${shop}/admin/api/${this.configService.get('API_VERSION')}/shop.json`, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
        })
        .pipe(
          catchError(err => {
            this.logger.error(`Error in ${ShopService.prototype.fetchShopJson.name}`, err.stack, {
              shop,
            });

            throw new InternalServerErrorException(`Error fetching shop json`);
          })
        )
    } catch (err) {
      this.logger.error(`Error in ${ShopService.prototype.fetchShopJson.name}`, err.stack, {
        shop,
      });

      throw new InternalServerErrorException(`Error fetching shop json`);
    }
  }

  private getQueryToCreate(shop: IShop) {
    try {
      return this.shopModel.updateOne(
        {name: shop.name},
        {name: shop.name, data: shop},
        {upsert: true},
      )
    } catch (err) {
      this.logger.error(`in: ${ShopService.prototype.getQueryToCreate.name}`, err.stack, {shop});
      throw new InternalServerErrorException('Error in creating query to create shop')
    }
  }
}
