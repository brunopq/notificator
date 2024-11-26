import type { ErrorRequestHandler } from "express"
import { StatusCodes } from "http-status-codes"

import { ZodError } from "zod"
import { HTTPError, NotFoundError } from "../errors/HTTPError"

export const unexpectedRequestHandler: ErrorRequestHandler = (
  err,
  req,
  _res,
  next,
) => {
  if (err) {
    return next(err)
  }
  throw new NotFoundError(`Route '${req.url}' not found`)
}

export const zodErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (!(err instanceof ZodError)) {
    return next(err)
  }

  res.status(StatusCodes.BAD_REQUEST).json({ errors: err.errors })
}

export const HTTPErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (!(err instanceof HTTPError)) {
    return next(err)
  }

  res.status(err.statusCode).json({ message: err.message })
}

export const unexpectedErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  console.error("Unexpected error")
  console.error(err)

  res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: "Internal Server Error" })
}
