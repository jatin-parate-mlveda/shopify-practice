import {Injectable} from '@nestjs/common';
import {HttpService} from "@nestjs/axios";
import {ConfigService} from "@nestjs/config";
import {Observable} from "rxjs";
import {AxiosResponse} from 'axios'

@Injectable()
export class ShopifyService {
  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {
  }

  generateOauthToken(shop: string, code: string): Observable<AxiosResponse<{ access_token: string, scope: string }>> {
    return this.httpService.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: this.configService.get<string>('API_KEY'),
      client_secret: this.configService.get<string>('API_SECRET'),
      code,
    })
  }
}
