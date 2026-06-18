export type ValidationResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      errorCode: "VALIDATION_ERROR";
      message: string;
      fieldErrors: Record<string, string>;
    };

export function validationFailure(
  fieldErrors: Record<string, string>,
  message = "Popraw błędy w formularzu.",
): ValidationResult<never> {
  return {
    ok: false,
    errorCode: "VALIDATION_ERROR",
    message,
    fieldErrors,
  };
}
