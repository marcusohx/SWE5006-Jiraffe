import { getServerSession } from "next-auth";
import { handleApiError } from "@/lib/api-error";
import { fail } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth.options";
import { parseSlaRuleSeverity, parseUpdateSlaRule } from "@/modules/sla-rule/sla-rule.dto";
import {
  getSlaRuleBySeverityController,
  updateSlaRuleBySeverityController,
} from "@/modules/sla-rule/sla-rule.controller";

export async function GET(_: Request, context: { params: Promise<{ severity: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }
    const params = await context.params;
    const severity = parseSlaRuleSeverity(params.severity);
    return await getSlaRuleBySeverityController(severity);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ severity: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }
    const params = await context.params;
    const severity = parseSlaRuleSeverity(params.severity);
    const body = await request.json();
    const input = parseUpdateSlaRule(body);
    return await updateSlaRuleBySeverityController(severity, input);
  } catch (error) {
    return handleApiError(error);
  }
}
