import { defineConfig } from "drizzle-kit"

import { env } from "./src/common/utils/envConfig"

const connection = {
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
}

export default defineConfig({
  schema: "./src/database/schema.ts",
  casing: "snake_case",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    ...connection,
  },
})
