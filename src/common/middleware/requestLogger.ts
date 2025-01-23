import { format } from "date-fns"
import type { RequestHandler } from "express"

export const requestLoggerMiddleware: RequestHandler = (req, res, next) => {
  const time = new Date(Date.now()).toString()
  console.log(
    `[${format(time, "yyyy-MM-dd HH:mm:ss O")}] ${req.method} ${req.url}`,
  )

  next()
}
