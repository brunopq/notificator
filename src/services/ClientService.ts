import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import type { db as database } from "@/database"
import { client } from "@/database/schema"
import { eq } from "drizzle-orm"

export const selectClientSchema = createSelectSchema(client, {
  phones: z.array(z.string()),
})
const insertClientSchema = createInsertSchema(client, {
  phones: z.array(z.string()),
})
const updateClientSchema = insertClientSchema
  .partial()
  .omit({ id: true, judiceId: true })

export type Client = z.infer<typeof selectClientSchema>
type NewClient = z.infer<typeof insertClientSchema>
type UpdateClient = z.infer<typeof updateClientSchema>

export class ClientService {
  constructor(private db: typeof database) {}

  async getByJudiceId(judiceId: number) {
    const dbClient = await this.db.query.client.findFirst({
      where: (client, { eq }) => eq(client.judiceId, judiceId),
    })

    return dbClient
  }

  async createClient(newClient: NewClient) {
    const [createdClient] = await this.db
      .insert(client)
      .values(newClient)
      .returning()

    return createdClient
  }

  async updateClient(id: string, updateClient: UpdateClient) {
    const [updatedClient] = await this.db
      .update(client)
      .set(updateClient)
      .where(eq(client.id, id))
      .returning()

    return updatedClient
  }
}
