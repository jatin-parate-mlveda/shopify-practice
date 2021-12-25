import { Module } from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {AccessToken, AccessTokenSchema} from "./models/access-token.schema";
import { AccessTokenService } from './access-token.service';
import {HttpModule} from "@nestjs/axios";

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      {
        name: AccessToken.name,
        collection: 'access_tokens',
        schema: AccessTokenSchema,
      }
    ]),
  ],
  providers: [AccessTokenService],
  exports: [AccessTokenService],
})
export class AccessTokenModule {}
