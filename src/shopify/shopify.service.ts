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

    return searchQuery.toString();
  }
}
