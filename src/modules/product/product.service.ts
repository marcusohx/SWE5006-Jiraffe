import type { CreateProductInput, UpdateProductInput } from "@/modules/product/product.dto";
import type { Product } from "@/modules/product/product.model";
import {
  createProduct as createProductRepo,
  deleteProductById as deleteProductByIdRepo,
  findProductById,
  listProducts as listProductsRepo,
  updateProductById as updateProductByIdRepo,
} from "@/modules/product/product.repository";

export async function listProducts(): Promise<Product[]> {
  return listProductsRepo();
}

export async function getProductById(id: string): Promise<Product> {
  const product = await findProductById(id);
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  return createProductRepo({
    name: input.name,
    price: input.price,
  });
}

export async function updateProductById(
  id: string,
  input: UpdateProductInput
): Promise<Product> {
  if (Object.keys(input).length === 0) {
    throw new Error("No updates provided");
  }
  const product = await updateProductByIdRepo(id, input);
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
}

export async function deleteProductById(id: string): Promise<void> {
  const deleted = await deleteProductByIdRepo(id);
  if (!deleted) {
    throw new Error("Product not found");
  }
}
