import cors from "cors"
import express, { type Express } from "express"

import {
  HTTPErrorHandler,
  unexpectedErrorHandler,
  unexpectedRequestHandler,
  zodErrorHandler,
} from "@/common/middleware/errorHandler"
import { requestLoggerMiddleware } from "@/common/middleware/requestLogger"
import { env } from "@/common/utils/envConfig"

import { judiceRouter } from "@/api/routers/judiceRouter"
import { lawsuitRouter } from "@/api/routers/lawsuitRouter"
import { movimentationRouter } from "@/api/routers/movimentationRouter"
import { notificationRouter } from "@/api/routers/notificationRouter"
import { publicationRouter } from "@/api/routers/publicationRouter"
import { agendaRouter } from "./api/routers/agendaRouter"
import { clientRouter } from "./api/routers/clientRouter"
import { emailRouter } from "./api/routers/emailRouter"
import { executionRouter } from "./api/routers/executionRouter"
import { reportRouter } from "./api/routers/reportRouter"

const app: Express = express()

// Set the application to trust the reverse proxy
app.set("trust proxy", true)

// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
app.use(requestLoggerMiddleware)

// Routes
app.use("/agenda", agendaRouter)
app.use("/judice", judiceRouter)
app.use("/publications", publicationRouter)
app.use("/lawsuits", lawsuitRouter)
app.use("/movimentations", movimentationRouter)
app.use("/notifications", notificationRouter)
app.use("/executions", executionRouter)
app.use("/clients", clientRouter)
app.use("/email", emailRouter)
app.use("/report", reportRouter)

app.get("/ping", (_req, res) => {
  res.json({ message: "pong" })
})

// Error handlers
app.use(unexpectedRequestHandler)
app.use(HTTPErrorHandler)
app.use(zodErrorHandler)

app.use(unexpectedErrorHandler) // should be last

export { app }
