import type { Result } from "@/lib/errors";

/** Client-side helper: returns the data or throws the user-facing message (for TanStack Query). */
export function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
