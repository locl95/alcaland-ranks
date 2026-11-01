export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(statusCode: number, message?: string, code?: string) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
    this.statusCode = statusCode;
    this.code = code;
  }

  print() {
    return {
      name: this.name,
      statusCode: this.statusCode,
    };
  }
}
