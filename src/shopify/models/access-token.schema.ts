import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document} from "mongoose";

export type AccessTokenDocument = AccessToken & Document;

@Schema({timestamps: false, versionKey: false})
export class AccessToken {
  @Prop({
    required: true,
    unique: true,
  })
  shop: string;


  @Prop({
    required: true,
  })
  accessToken: string;
}

export const AccessTokenSchema = SchemaFactory.createForClass(AccessToken);
