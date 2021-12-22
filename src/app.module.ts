import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {ShopifyModule} from './shopify/shopify.module';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {MongooseModule} from "@nestjs/mongoose";

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
    ShopifyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
