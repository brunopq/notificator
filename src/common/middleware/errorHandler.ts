import type { ErrorRequestHandler, RequestHandler } from "express"
import { StatusCodes } from "http-status-codes"

import { HTTPError } from "../errors/HTTPError"

export const unexpectedRequest: RequestHandler = (_req, res) => {
  res.sendStatus(StatusCodes.NOT_FOUND)
}

export const handleError: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof HTTPError) {
    res.status(err.statusCode).json({ message: err.message })
    return
  }
  console.error("Unexpected error")
  console.error(err)

  res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: "Internal Server Error" })
  return
}
