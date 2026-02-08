import { ok } from "@/lib/api-response";
import type { CreateProductInput, UpdateProductInput } from "@/modules/product/product.dto";
import {
  createProduct,
  deleteProductById,
  getProductById,
  listProducts,
  updateProductById,
} from "@/modules/product/product.service";

export async function listProductsController() {
  const products = await listProducts();
  return ok(products);
}

export async function createProductController(input: CreateProductInput) {
  const product = await createProduct(input);
  return ok(product, 201);
}

export async function getProductByIdController(id: string) {
  const product = await getProductById(id);
  return ok(product);
}

export async function updateProductByIdController(id: string, input: UpdateProductInput) {
  const product = await updateProductById(id, input);
  return ok(product);
}

export async function deleteProductByIdController(id: string) {
  await deleteProductById(id);
  return ok({ deleted: true });
}
