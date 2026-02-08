import { z } from "zod";

export const productIdSchema = z.string().min(1, "Product id is required");

export const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export function parseCreateProduct(input: unknown): CreateProductInput {
  return createProductSchema.parse(input);
}

export function parseUpdateProduct(input: unknown): UpdateProductInput {
  return updateProductSchema.parse(input);
}

export function parseProductId(input: unknown): string {
  return productIdSchema.parse(input);
}
