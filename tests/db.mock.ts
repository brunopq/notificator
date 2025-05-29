import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "../src/database/schema"

export const dbMock = drizzle.mock({
  schema,
  casing: "snake_case",
})
