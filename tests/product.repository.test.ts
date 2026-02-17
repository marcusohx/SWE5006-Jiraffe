import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProduct,
  deleteProductById,
  findProductById,
  updateProductById,
} from "@/modules/product/product.repository";

const {
  connectMongo,
  productFindById,
  productCreate,
  productFindByIdAndUpdate,
  productDeleteOne,
} = vi.hoisted(() => ({
  connectMongo: vi.fn(),
  productFindById: vi.fn(),
  productCreate: vi.fn(),
  productFindByIdAndUpdate: vi.fn(),
  productDeleteOne: vi.fn(),
}));

vi.mock("@/lib/db/mongodb", () => ({
  connectMongo,
}));

vi.mock("@/modules/product/product.model", () => ({
  ProductModel: {
    findById: productFindById,
    create: productCreate,
    findByIdAndUpdate: productFindByIdAndUpdate,
    deleteOne: productDeleteOne,
    find: vi.fn().mockReturnValue({ sort: vi.fn().mockResolvedValue([]) }),
  },
}));

function makeProductDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => "product-doc-id" },
    name: "Test Widget",
    price: 9.99,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("product.repository — findProductById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns null for invalid ObjectId", async () => {
    const result = await findProductById("not-a-valid-id");
    expect(result).toBeNull();
    expect(productFindById).not.toHaveBeenCalled();
  });

  it("returns null when product does not exist", async () => {
    productFindById.mockResolvedValue(null);

    const result = await findProductById("67dc66fd6f57fd4fce4d8548");
    expect(result).toBeNull();
  });

  it("returns mapped product when found", async () => {
    const doc = makeProductDoc();
    productFindById.mockResolvedValue(doc);

    const result = await findProductById("67dc66fd6f57fd4fce4d8548");

    expect(result).toEqual({
      id: "product-doc-id",
      name: "Test Widget",
      price: 9.99,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  });
});

describe("product.repository — createProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("creates and returns mapped product", async () => {
    const doc = makeProductDoc();
    productCreate.mockResolvedValue(doc);

    const result = await createProduct({ name: "Test Widget", price: 9.99 });

    expect(productCreate).toHaveBeenCalledWith({ name: "Test Widget", price: 9.99 });
    expect(result.id).toBe("product-doc-id");
    expect(result.name).toBe("Test Widget");
    expect(result.price).toBe(9.99);
  });
});

describe("product.repository — updateProductById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns null for invalid ObjectId", async () => {
    const result = await updateProductById("bad-id", { name: "New Name" });
    expect(result).toBeNull();
    expect(productFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns null when product does not exist", async () => {
    productFindByIdAndUpdate.mockResolvedValue(null);

    const result = await updateProductById("67dc66fd6f57fd4fce4d8548", { price: 5 });
    expect(result).toBeNull();
  });

  it("returns mapped product when updated", async () => {
    const doc = makeProductDoc({ name: "Updated Widget" });
    productFindByIdAndUpdate.mockResolvedValue(doc);

    const result = await updateProductById("67dc66fd6f57fd4fce4d8548", { name: "Updated Widget" });

    expect(result?.name).toBe("Updated Widget");
  });
});

describe("product.repository — deleteProductById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns false for invalid ObjectId", async () => {
    const result = await deleteProductById("bad-id");
    expect(result).toBe(false);
    expect(productDeleteOne).not.toHaveBeenCalled();
  });

  it("returns false when product does not exist", async () => {
    productDeleteOne.mockResolvedValue({ deletedCount: 0 });

    const result = await deleteProductById("67dc66fd6f57fd4fce4d8548");
    expect(result).toBe(false);
  });

  it("returns true when product is deleted", async () => {
    productDeleteOne.mockResolvedValue({ deletedCount: 1 });

    const result = await deleteProductById("67dc66fd6f57fd4fce4d8548");
    expect(result).toBe(true);
  });
});
