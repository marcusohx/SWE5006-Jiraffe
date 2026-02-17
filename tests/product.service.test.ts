import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/modules/product/product.model";
import {
  createProduct,
  deleteProductById,
  getProductById,
  updateProductById,
} from "@/modules/product/product.service";
import {
  createProduct as createProductRepo,
  deleteProductById as deleteProductByIdRepo,
  findProductById,
  updateProductById as updateProductByIdRepo,
} from "@/modules/product/product.repository";

vi.mock("@/modules/product/product.repository", () => ({
  listProducts: vi.fn(),
  findProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProductById: vi.fn(),
  deleteProductById: vi.fn(),
}));

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    name: "Test Widget",
    price: 9.99,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("product.service — getProductById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns product when found", async () => {
    const product = makeProduct();
    vi.mocked(findProductById).mockResolvedValue(product);

    const result = await getProductById("product-1");

    expect(result).toEqual(product);
  });

  it("throws when product not found", async () => {
    vi.mocked(findProductById).mockResolvedValue(null);

    await expect(getProductById("nonexistent-id")).rejects.toThrow("Product not found");
  });
});

describe("product.service — createProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates and returns a product", async () => {
    const product = makeProduct();
    vi.mocked(createProductRepo).mockResolvedValue(product);

    const result = await createProduct({ name: "Test Widget", price: 9.99 });

    expect(createProductRepo).toHaveBeenCalledWith({ name: "Test Widget", price: 9.99 });
    expect(result).toEqual(product);
  });
});

describe("product.service — updateProductById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns updated product", async () => {
    const updated = makeProduct({ name: "Updated Widget" });
    vi.mocked(updateProductByIdRepo).mockResolvedValue(updated);

    const result = await updateProductById("product-1", { name: "Updated Widget" });

    expect(result).toEqual(updated);
  });

  it("throws when no updates provided", async () => {
    await expect(updateProductById("product-1", {})).rejects.toThrow("No updates provided");
  });

  it("throws when product not found", async () => {
    vi.mocked(updateProductByIdRepo).mockResolvedValue(null);

    await expect(updateProductById("product-1", { price: 5 })).rejects.toThrow("Product not found");
  });
});

describe("product.service — deleteProductById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves when product is deleted", async () => {
    vi.mocked(deleteProductByIdRepo).mockResolvedValue(true);

    await expect(deleteProductById("product-1")).resolves.toBeUndefined();
  });

  it("throws when product not found", async () => {
    vi.mocked(deleteProductByIdRepo).mockResolvedValue(false);

    await expect(deleteProductById("nonexistent-id")).rejects.toThrow("Product not found");
  });
});
