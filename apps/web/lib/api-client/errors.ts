export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** Convenience: was this a 401 Unauthorized? */
  get isUnauthorized() {
    return this.status === 401;
  }

  /** Convenience: was this a 403 Forbidden? */
  get isForbidden() {
    return this.status === 403;
  }

  /** Convenience: was this a 404 Not Found? */
  get isNotFound() {
    return this.status === 404;
  }
}
