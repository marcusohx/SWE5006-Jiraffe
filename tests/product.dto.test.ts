import { describe, expect, it } from "vitest";
import {
  createProductSchema,
  updateProductSchema,
  parseCreateProduct,
  parseUpdateProduct,
  parseProductId,
} from "@/modules/product/product.dto";

describe("createProductSchema", () => {
  it("accepts valid name and price", () => {
    const result = createProductSchema.safeParse({ name: "Widget", price: 9.99 });
    expect(result.success).toBe(true);
  });

  it("accepts price of zero", () => {
    const result = createProductSchema.safeParse({ name: "Free Item", price: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = createProductSchema.safeParse({ price: 9.99 });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createProductSchema.safeParse({ name: "", price: 9.99 });
    expect(result.success).toBe(false);
  });

  it("rejects missing price", () => {
    const result = createProductSchema.safeParse({ name: "Widget" });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = createProductSchema.safeParse({ name: "Widget", price: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects string price", () => {
    const result = createProductSchema.safeParse({ name: "Widget", price: "9.99" });
    expect(result.success).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updateProductSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts only name", () => {
    const result = updateProductSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts only price", () => {
    const result = updateProductSchema.safeParse({ price: 19.99 });
    expect(result.success).toBe(true);
  });

  it("accepts both name and price", () => {
    const result = updateProductSchema.safeParse({ name: "Updated Widget", price: 14.99 });
    expect(result.success).toBe(true);
  });

  it("rejects negative price", () => {
    const result = updateProductSchema.safeParse({ price: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = updateProductSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("parseCreateProduct", () => {
  it("returns parsed product for valid data", () => {
    const result = parseCreateProduct({ name: "Widget", price: 9.99 });
    expect(result.name).toBe("Widget");
    expect(result.price).toBe(9.99);
  });

  it("throws for missing name", () => {
    expect(() => parseCreateProduct({ price: 9.99 })).toThrow();
  });

  it("throws for negative price", () => {
    expect(() => parseCreateProduct({ name: "Widget", price: -1 })).toThrow();
  });

  it("throws for missing price", () => {
    expect(() => parseCreateProduct({ name: "Widget" })).toThrow();
  });
});

describe("parseUpdateProduct", () => {
  it("returns parsed input for valid data", () => {
    const result = parseUpdateProduct({ name: "New Widget" });
    expect(result.name).toBe("New Widget");
  });

  it("returns empty object for empty input (all optional)", () => {
    const result = parseUpdateProduct({});
    expect(result).toEqual({});
  });

  it("throws for negative price", () => {
    expect(() => parseUpdateProduct({ price: -5 })).toThrow();
  });
});

describe("parseProductId", () => {
  it("returns the id string for valid input", () => {
    expect(parseProductId("prod-123")).toBe("prod-123");
  });

  it("throws for empty string", () => {
    expect(() => parseProductId("")).toThrow();
  });

  it("throws for non-string", () => {
    expect(() => parseProductId(42)).toThrow();
  });
});
