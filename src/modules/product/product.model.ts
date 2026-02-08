import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export interface Product {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRepositoryInput {
  name: string;
  price: number;
}

export interface UpdateProductRepositoryInput {
  name?: string;
  price?: number;
}

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export type ProductDocument = InferSchemaType<typeof productSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ProductModel: Model<ProductDocument> =
  mongoose.models.Product ?? mongoose.model<ProductDocument>("Product", productSchema);
