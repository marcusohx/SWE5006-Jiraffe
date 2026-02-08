import { handleApiError } from "@/lib/api-error";
import { parseCreateProduct } from "@/modules/product/product.dto";
import {
  createProductController,
  listProductsController,
} from "@/modules/product/product.controller";

export async function GET() {
  try {
    return await listProductsController();
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parseCreateProduct(body);
    return await createProductController(input);
  } catch (error) {
    return handleApiError(error);
  }
}
