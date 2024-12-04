import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { db } from "@/database"
import { client } from "@/database/schema"

import JudiceService from "./JudiceService"

const selectClientSchema = createSelectSchema(client, {
  phones: z.array(z.string()),
})
const insertClientSchema = createInsertSchema(client, {
  phones: z.array(z.string()),
})

type Client = z.infer<typeof selectClientSchema>
type NewClient = z.infer<typeof insertClientSchema>

class ClientService {
  async getByJudiceId(judiceId: number) {
    const dbClient = await db.query.client.findFirst({
      where: (client, { eq }) => eq(client.judiceId, judiceId),
    })

    return dbClient
  }

  async getOrCreateByJudiceId(id: number) {
    const dbClient = await this.getByJudiceId(id)

    if (dbClient) {
      return dbClient
    }

    const clientInfo = await JudiceService.getClientByJudiceId(id)

    const phones = []

    if (clientInfo.celular) {
      phones.push(clientInfo.celular)
    }

    const createdClient = await this.createClient({
      judiceId: id,
      name: clientInfo.nome,
      cpf: clientInfo.cpf,
      phones,
    })

    return createdClient
  }

  async createClient(newClient: NewClient) {
    const [createdClient] = await db
      .insert(client)
      .values(newClient)
      .returning()

    return createdClient
  }
}

export default new ClientService()
