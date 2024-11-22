import cors from "cors"
import express, { type Express } from "express"

import errorHandler from "@/common/middleware/errorHandler"
import { env } from "@/common/utils/envConfig"

import { judiceRouter } from "@/api/routers/judiceRouter"
import { publicationRouter } from "@/api/routers/publicationRouter"

const app: Express = express()

// Set the application to trust the reverse proxy
app.set("trust proxy", true)

// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))

// Routes
app.use("/judice", judiceRouter)
app.use("/publications/", publicationRouter)

app.get("/ping", (_req, res) => {
  res.json({ message: "pong" })
})

// Error handlers
app.use(errorHandler())

export { app }
