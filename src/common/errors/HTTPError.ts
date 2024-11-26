import { StatusCodes } from "http-status-codes"

export class HTTPError extends Error {
  constructor(
    public message: string,
    public statusCode: StatusCodes,
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends HTTPError {
  constructor(message = "Not Found") {
    super(message, StatusCodes.NOT_FOUND)
  }
}

export class BadRequestError extends HTTPError {
  constructor(message = "Bad Request") {
    super(message, StatusCodes.BAD_REQUEST)
  }
}

export class InternalServerError extends HTTPError {
  constructor(message = "Internal Server Error") {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR)
  }
}
