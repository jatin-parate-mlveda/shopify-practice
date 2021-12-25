import {Injectable} from '@nestjs/common';
import {createHmac} from "crypto";

@Injectable()
export class ShopifyService {
  constructor() {
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
