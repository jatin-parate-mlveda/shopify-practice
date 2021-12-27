import {CACHE_MANAGER, Inject, Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {AccessToken, AccessTokenDocument} from "./models/access-token.schema";
import {Model, Query, UpdateWriteOpResult} from "mongoose";
import {HttpService} from "@nestjs/axios";
import {ConfigService} from "@nestjs/config";
import {catchError, from, map, Observable, switchMap} from "rxjs";
import {Cache} from 'cache-manager';
import {AxiosResponse} from "axios";

type storeAccessTokenReturn = Query<UpdateWriteOpResult,
  AccessTokenDocument & { _id: AccessTokenDocument["_id"] },
  {},
  AccessTokenDocument>;

@Injectable()
export class AccessTokenService {
  private logger = new Logger(AccessTokenService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cache: Cache,
    @InjectModel(AccessToken.name) private readonly accessTokenModel: Model<AccessTokenDocument>,
  ) {
  }

  getQueryToGetByShop(shop: string) {
    try {
      return this.accessTokenModel.findOne({shop});
    } catch (err) {
      this.logger.error(`in: ${AccessTokenService.prototype.getQueryToGetByShop.name}`, err.stack, { shop });
      throw new InternalServerErrorException('Error in generating query to get by shop');
    }
  }

  async getByShop(shop: string) {
    try {
      const cacheKey = `access-token:${shop}`;
      let result = await this.cache.get<string>(cacheKey);

      if (result) {
        return result;
      }

      const doc = await this.getQueryToGetByShop(shop).select({_id: -1, accessToken: 1}).lean().exec();

      this.cache.set(cacheKey, doc.accessToken)
        .catch(err => {
          this.logger.error(err, {shop}, AccessTokenService.prototype.getByShop.name);
        });
      return doc.accessToken;
    } catch (err) {
      this.logger.error(`in: ${AccessTokenService.prototype.getByShop.name}`, err.stack, {shop});
      throw new InternalServerErrorException('Error while getting access token');
    }
  }

  generateAndStoreAccessToken(shop: string, code: string): Observable<string> {
    try {
      return this.generateAccessToken(shop, code)
        .pipe(
          switchMap(({data: {access_token}}) => {
            return from(this.getQueryToStoreAccessToken(access_token, shop).exec())
              .pipe(
                map(() => access_token),
                catchError(err => {
                  this.logger.error(`in: ${AccessTokenService.prototype.getQueryToStoreAccessToken.name}`, err.stack, {shop});
                  throw new InternalServerErrorException('Error while storing access token');
                })
              )
          }),
        );
    } catch (err) {
      this.logger.error(`in: ${AccessTokenService.prototype.getQueryToStoreAccessToken.name}`, err.stack, {shop});
      throw new InternalServerErrorException('Error while storing access token');
    }
  }

  private generateAccessToken(shop: string, code: string): Observable<AxiosResponse<{ access_token: string, scope: string }>> {
    try {
      return this.httpService.post(
        `https://${shop}/admin/oauth/access_token`,
        {
          client_id: this.configService.get<string>('API_KEY'),
          client_secret: this.configService.get<string>('API_SECRET'),
          code,
        },
        {timeout: 1000 * 3},
      )
        .pipe(
          catchError(err => {
            this.logger.error(`in: ${AccessTokenService.prototype.generateAccessToken.name}`, err.stack, {shop});
            throw new InternalServerErrorException('Error while generating access token');
          }),
        );
    } catch (err) {
      this.logger.error(`in: ${AccessTokenService.prototype.generateAccessToken.name}`, err.stack, {shop});
      throw new InternalServerErrorException('Error while generating access token');
    }
  }

  private getQueryToStoreAccessToken(accessToken: string, shop: string): storeAccessTokenReturn {
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
