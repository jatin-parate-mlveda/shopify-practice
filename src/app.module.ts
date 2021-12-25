import {Module} from '@nestjs/common';
import {RouterModule} from "@nestjs/core";
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {ShopifyModule} from './shopify/shopify.module';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {MongooseModule} from "@nestjs/mongoose";
import {ShopModule} from './shop/shop.module';
import {AccessTokenModule} from './access-token/access-token.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, cache: false}),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
          uri: configService.get<string>('DB_URL'),
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }),
    }),
    AccessTokenModule,
    ShopModule,
    ShopifyModule,
    RouterModule.register([
      {
        path: 'shopify',
        module: ShopifyModule,
      }
    ])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
