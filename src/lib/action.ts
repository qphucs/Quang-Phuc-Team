import "server-only";
import type { z } from "zod";
import type { SessionUser } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { AppError, fail, ok, type Result } from "@/lib/errors";
import { can, type Permission } from "@/lib/permissions";

type ActionContext = { user: SessionUser };

type ActionConfig<S extends z.ZodType, T> = {
  schema: S;
  /** Required permission. Omit only for actions that any signed-in user may run. */
  permission?: Permission;
  handler: (input: z.output<S>, ctx: ActionContext) => Promise<T>;
};

function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  return fields;
}

/**
 * 🔒 Standard Server Action wrapper (docs/03-conventions.md §6.5):
 * auth → permission → Zod parse → handler → Result<T>. Never leaks raw errors.
 */
export function action<S extends z.ZodType, T>(config: ActionConfig<S, T>) {
  return async (input: z.input<S>): Promise<Result<T>> => {
    try {
      const session = await getSession();
      if (!session) return fail("UNAUTHENTICATED");
      if (config.permission && !can(session.user, config.permission)) return fail("FORBIDDEN");

      const parsed = config.schema.safeParse(input);
      if (!parsed.success) return fail("VALIDATION_ERROR", undefined, zodFieldErrors(parsed.error));

      return ok(await config.handler(parsed.data, { user: session.user }));
    } catch (error) {
      if (error instanceof AppError) return fail(error.code, error.message, error.fields);
      console.error("[action] unexpected error", error);
      return fail("INTERNAL_ERROR");
    }
  };
}
