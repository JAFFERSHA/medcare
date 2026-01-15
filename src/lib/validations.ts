import { z } from "zod";

export function getZodErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    const issues = error.issues;
    if (issues.length > 0) {
      return issues[0].message;
    }
    return "Validation error";
  }
  return "Unknown error";
}

export function isZodError(error: unknown): boolean {
  return error instanceof z.ZodError;
}
