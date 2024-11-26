import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

import { env } from "@/common/utils/envConfig"

import * as schema from "./schema"

const connection = {
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  port: env.DB_PORT,
}

const drizzleConfig = {
  schema,
  casing: "snake_case",
} as const

const migration = postgres({ ...connection, max: 1 })
const sql = postgres({ ...connection })

export const db = drizzle(sql, drizzleConfig)

await migrate(drizzle(migration, drizzleConfig), {
  migrationsFolder: "./drizzle",
})
await migration.end()
