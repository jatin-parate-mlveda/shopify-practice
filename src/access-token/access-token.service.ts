import {Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {AccessToken, AccessTokenDocument} from "./models/access-token.schema";
import {Model, Query, UpdateWriteOpResult} from "mongoose";
import {HttpService} from "@nestjs/axios";
import {ConfigService} from "@nestjs/config";
import {from, map, Observable, switchMap} from "rxjs";
import {AxiosResponse} from "axios";

type storeAccessTokenReturn = Query<UpdateWriteOpResult,
  AccessTokenDocument & { _id: AccessTokenDocument["_id"] },
  {},
  AccessTokenDocument>;

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(AccessToken.name) private readonly accessTokenModel: Model<AccessTokenDocument>,
  ) {
  }

  getByShop(shop: string) {
    return this.accessTokenModel.findOne({shop}).lean();
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
