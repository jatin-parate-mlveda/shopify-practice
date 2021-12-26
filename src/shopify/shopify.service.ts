import {Injectable} from '@nestjs/common';
import {createHmac} from "crypto";
import * as _ from 'lodash';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class ShopifyService {
  constructor(
    private readonly configService: ConfigService,
  ) {
  }

  private static generateKvp(queryMap: Record<string, string>): string {
    const omittedQuery = _.omit(
      queryMap,
      ['signature', 'hmac'],
    );

    const sortedEntries = _.sortBy(_.entries(omittedQuery), ([key]) => key);

    const searchQuery = new URLSearchParams();

    _.forEach(sortedEntries, ([key, value]) => {
      searchQuery.append(key, value);
    });

    return decodeURIComponent(searchQuery.toString());
  }

  isGeneratedHashEqualsHash(hmac: string, queryMap: Record<string, string>): boolean {
    const generatedHmac = this.getHmacHash(queryMap);
    return generatedHmac === hmac.toUpperCase();
  }

  private getHmacHash(
    queryMap: Record<string, string>,
  ): string {
    let hash = createHmac(
      'sha256',
      this.configService.get<string>('API_SECRET'),
    )
      .update(ShopifyService.generateKvp(queryMap))
      .digest('hex')

    return hash.toUpperCase();
  };

  // static generateKvpOld(queryMap: Record<string, string>): string {
  //   return Object.getOwnPropertyNames(queryMap)
  //     .filter(key => key !== 'signature' && key !== 'hmac')
  //     .sort()
  //     .map(
  //       (key) =>
  //         `${ShopifyService.replaceChars(key, true)}=${ShopifyService.replaceChars(queryMap[key], false)}`,
  //     )
  //     .join('&')
  // }

  // static replaceChars(s: string, isKey: boolean) {
  //   if (!s) {
  //     return '';
  //   }
  //
  //   let output = s.replace(/%/gi, '%25').replace(/&/gi, '%26');
  //
  //   if (isKey) {
  //     output = output.replace(/=/gi, '%3D');
  //   }
  //
  //   return output;
  // }
}
