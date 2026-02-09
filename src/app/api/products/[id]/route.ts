import { handleApiError } from "@/lib/api-error";
import { parseProductId, parseUpdateProduct } from "@/modules/product/product.dto";
import {
  deleteProductByIdController,
  getProductByIdController,
  updateProductByIdController,
} from "@/modules/product/product.controller";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsedId = parseProductId(id);
    return await getProductByIdController(parsedId);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsedId = parseProductId(id);
    const body = await request.json();
    const input = parseUpdateProduct(body);
    return await updateProductByIdController(parsedId, input);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsedId = parseProductId(id);
    return await deleteProductByIdController(parsedId);
  } catch (error) {
    return handleApiError(error);
  }
}
