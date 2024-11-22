import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

import { db } from "@/database"
import { lawsuit } from "@/database/schema"

import ClientService from "./ClientService"
import JudiceService from "./JudiceService"

const selectLawsuitSchema = createSelectSchema(lawsuit)
const insertLawsuitSchema = createInsertSchema(lawsuit)

type Lawsuit = z.infer<typeof selectLawsuitSchema>
type NewLawsuit = z.infer<typeof insertLawsuitSchema>

class LawsuitService {
  async getByCNJ(cnj: string) {
    return await db.query.lawsuit.findFirst({
      where: (lawsuit, { eq }) => eq(lawsuit.cnj, cnj),
    })
  }

  async create(newLawsuit: NewLawsuit) {
    const [createdLawsuit] = await db
      .insert(lawsuit)
      .values(newLawsuit)
      .returning()

    return createdLawsuit
  }

  async getOrCreateByCNJ(cnj: string) {
    console.log(`Searching for lawsuit with cnj: ${cnj}`)
    const dbLawsuit = await this.getByCNJ(cnj)

    if (dbLawsuit) {
      console.log(`Lawsuit ${cnj} found in database`)
      return dbLawsuit
    }

    const judiceLawsuit = await JudiceService.searchLawsuitByCNJ(cnj)

    if (!judiceLawsuit) {
      console.log("lawsuit not found in judice")
      return null
    }

    const dbLawsuitJudiceId = await db.query.lawsuit.findFirst({
      where: ({ judiceId }, { eq }) => eq(judiceId, judiceLawsuit.f_id),
    })

    if (dbLawsuitJudiceId) {
      console.log(`Lawsuit with judice id ${judiceLawsuit.f_id} already exists`)
      return null
    }

    const client = await ClientService.getOrCreateByJudiceId(
      judiceLawsuit.f_client,
    )

    if (!client) {
      console.log("client not found when creating lawsuit")
      return null
    }

    const createdLawsuit = await this.create({
      judiceId: judiceLawsuit.f_id,
      clientId: client.id,
      cnj,
    })

    console.log(`Lawsuit ${cnj} created!`)

    return createdLawsuit
  }
}

export default new LawsuitService()
