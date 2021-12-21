import {Injectable} from '@nestjs/common';
import {HttpService} from "@nestjs/axios";
import {ConfigService} from "@nestjs/config";
import {catchError, map, Observable} from "rxjs";
import {AxiosResponse} from 'axios'
import {createHmac} from "crypto";

@Injectable()
export class ShopifyService {
  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {
  }

  generateOauthToken(shop: string, code: string): Observable<AxiosResponse<{ access_token: string, scope: string }>> {
    return this.httpService.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: this.configService.get<string>('API_KEY'),
      client_secret: this.configService.get<string>('API_SECRET'),
      code,
    }, {timeout: 1000 * 3}).pipe(map(res => {
      console.log('res', res.data);
      return res;
    }), catchError(err => {
      console.log(19, err.response?.body);
      throw err;
    }))
  }

  static replaceChars(s: string, isKey: boolean) {
    if (!s) {
      return '';
    }

    let output = s.replace(/%/gi, '%25').replace(/&/gi, '%26');

    if (isKey) {
      output = output.replace(/=/gi, '%3D');
    }

    return output;
  }

  static generateKvp(queryMap: Record<string, string>): string {
    return Object.getOwnPropertyNames(queryMap)
      .filter(key => key !== 'signature' && key !== 'hmac')
      .sort()
      .map(
        (key) =>
          `${ShopifyService.replaceChars(key, true)}=${ShopifyService.replaceChars(queryMap[key], false)}`,
      )
      .join('&')
  }

  static getHmacHash(
    secretKey: string,
    hashString: string,
  ): string {
    let hash = createHmac(
      'sha256',
      secretKey,
    )
      .update(hashString)
      .digest('hex')

    return hash.toUpperCase();
  };
}
