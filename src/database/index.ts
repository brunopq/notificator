import type { DrizzleConfig } from "drizzle-orm"
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
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
} satisfies postgres.Options<{}>

const drizzleConfig = {
  schema,
  casing: "snake_case",
} satisfies DrizzleConfig<typeof schema>

const migration = postgres({ ...connection, max: 1 })
const sql = postgres({ ...connection })

export const db = drizzle(sql, drizzleConfig)
export type databaseType = typeof db

await migrate(drizzle(migration, drizzleConfig), {
  migrationsFolder: "./drizzle",
})
await migration.end()
