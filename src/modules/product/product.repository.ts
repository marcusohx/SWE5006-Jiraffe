import mongoose from "mongoose";
import { connectMongo } from "@/lib/db/mongodb";
import type {
  CreateProductRepositoryInput,
  Product,
  UpdateProductRepositoryInput,
} from "@/modules/product/product.model";
import { ProductModel, type ProductDocument } from "@/modules/product/product.model";

function mapProduct(doc: ProductDocument): Product {
  return {
    id: doc._id.toString(),
    name: doc.name,
    price: doc.price,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listProducts(): Promise<Product[]> {
  await connectMongo();
  const products = await ProductModel.find().sort({ createdAt: -1 });
  return products.map(mapProduct);
}

export async function createProduct(
  data: CreateProductRepositoryInput
): Promise<Product> {
  await connectMongo();
  const created = await ProductModel.create({
    name: data.name,
    price: data.price,
  });
  return mapProduct(created);
}

export async function findProductById(id: string): Promise<Product | null> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  const product = await ProductModel.findById(id);
  return product ? mapProduct(product) : null;
}

export async function updateProductById(
  id: string,
  updates: UpdateProductRepositoryInput
): Promise<Product | null> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  const updated = await ProductModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
  return updated ? mapProduct(updated) : null;
}

export async function deleteProductById(id: string): Promise<boolean> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }
  const result = await ProductModel.deleteOne({ _id: id });
  return result.deletedCount === 1;
}
