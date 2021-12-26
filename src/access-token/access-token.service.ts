import {CACHE_MANAGER, Inject, Injectable, Logger} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {AccessToken, AccessTokenDocument} from "./models/access-token.schema";
import {Model, Query, UpdateWriteOpResult} from "mongoose";
import {HttpService} from "@nestjs/axios";
import {ConfigService} from "@nestjs/config";
import {from, map, Observable, switchMap} from "rxjs";
import {Cache} from 'cache-manager';
import {AxiosResponse} from "axios";

type storeAccessTokenReturn = Query<UpdateWriteOpResult,
  AccessTokenDocument & { _id: AccessTokenDocument["_id"] },
  {},
  AccessTokenDocument>;

@Injectable()
export class AccessTokenService {
  logger = new Logger(AccessTokenService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cache: Cache,
    @InjectModel(AccessToken.name) private readonly accessTokenModel: Model<AccessTokenDocument>,
  ) {
  }

  async getByShop(shop: string) {
    const cacheKey = `access-token:${shop}`;
    let result = await this.cache.get<string>(cacheKey);

    if (result) {
      return JSON.parse(result) as AccessToken;
    }

    const doc = await this.accessTokenModel.findOne({shop}).lean().exec();

    this.cache.set(cacheKey, JSON.stringify(doc))
      .catch(err => {
        this.logger.error(err, {shop}, AccessTokenService.prototype.getByShop.name);
      });
    return doc;
  }

  generateAndStoreAccessToken(shop: string, code: string): Observable<string> {
    return this.generateAccessToken(shop, code)
      .pipe(
        switchMap(({data: {access_token}}) => {
          return from(this.storeAccessToken(access_token, shop).exec())
            .pipe(
              map(() => access_token)
            )
        }),
      );
  }

  private generateAccessToken(shop: string, code: string): Observable<AxiosResponse<{ access_token: string, scope: string }>> {
    return this.httpService.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: this.configService.get<string>('API_KEY'),
        client_secret: this.configService.get<string>('API_SECRET'),
        code,
      },
      {timeout: 1000 * 3},
    );
  }

  private storeAccessToken(accessToken: string, shop: string): storeAccessTokenReturn {
    return this.accessTokenModel.updateOne(
      {shop},
      {
        accessToken,
        shop,
      },
      {upsert: true},
    );
  }
}
