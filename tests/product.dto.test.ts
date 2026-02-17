import { describe, expect, it } from "vitest";
import { createProductSchema, updateProductSchema } from "@/modules/product/product.dto";

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
