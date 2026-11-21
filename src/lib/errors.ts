/** 🔒 Error codes — docs/03-conventions.md §6.3. Add a code there first. */
export const ERROR_CODES = {
  VALIDATION_ERROR: { status: 400, message: "Dữ liệu chưa hợp lệ. Hãy kiểm tra lại các ô được đánh dấu." },
  UNAUTHENTICATED: { status: 401, message: "Phiên đăng nhập đã hết. Hãy đăng nhập lại." },
  FORBIDDEN: { status: 403, message: "Bạn không có quyền thực hiện việc này." },
  NOT_FOUND: { status: 404, message: "Không tìm thấy nội dung bạn cần." },
  CONFLICT: { status: 409, message: "Dữ liệu bị trùng. Hãy thử giá trị khác." },
  RATE_LIMITED: { status: 429, message: "Bạn thao tác quá nhanh. Hãy thử lại sau ít phút." },
  UPSTREAM_ERROR: { status: 502, message: "Nguồn bên ngoài đang lỗi. Hãy thử lại sau." },
  INTERNAL_ERROR: { status: 500, message: "Có lỗi xảy ra. Hãy thử lại." },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export type ResultError = {
  code: ErrorCode;
  message: string;
  fields?: Record<string, string>;
};

/** 🔒 The only result shape returned by Server Actions and API routes. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: ResultError };

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message ?? ERROR_CODES[code].message);
    this.name = "AppError";
  }
}

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

export const fail = (code: ErrorCode, message?: string, fields?: Record<string, string>): Result<never> => ({
  ok: false,
  error: { code, message: message ?? ERROR_CODES[code].message, ...(fields ? { fields } : {}) },
});
