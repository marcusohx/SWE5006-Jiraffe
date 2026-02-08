import { handleApiError } from "@/lib/api-error";
import { parseProductId, parseUpdateProduct } from "@/modules/product/product.dto";
import {
  deleteProductByIdController,
  getProductByIdController,
  updateProductByIdController,
} from "@/modules/product/product.controller";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const id = parseProductId(params.id);
    return await getProductByIdController(id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const id = parseProductId(params.id);
    const body = await request.json();
    const input = parseUpdateProduct(body);
    return await updateProductByIdController(id, input);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const id = parseProductId(params.id);
    return await deleteProductByIdController(id);
  } catch (error) {
    return handleApiError(error);
  }
}
