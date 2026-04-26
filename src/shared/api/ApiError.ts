export class ApiError extends Error {
  statusCode: number

  constructor(statusCode: number, message?: string) {
    super(message)
    Object.setPrototypeOf(this, ApiError.prototype)
    this.statusCode = statusCode
  }

  print() {
    return {
      name: this.name,
      statusCode: this.statusCode,
    }
  }
}
