import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from "mongoose";
import {IShop} from "shopify-api-node";

export type ShopDocument = Shop & Document;

@Schema({
  versionKey: false,
  timestamps: false,
})
export class Shop {
  @Prop({required: true, unique: true})
  name: string;

  @Prop({type: MongooseSchema.Types.Mixed, required: true})
  data: IShop;
}

export const ShopSchema = SchemaFactory.createForClass(Shop);

ShopSchema.index({name: 1});
