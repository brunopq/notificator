import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

import type { Paginated, PaginationInput } from "@/common/models/pagination"

import type { db as database } from "@/database"
import { lawsuit } from "@/database/schema"

const selectLawsuitSchema = createSelectSchema(lawsuit)
export const insertLawsuitSchema = createInsertSchema(lawsuit)

type Lawsuit = z.infer<typeof selectLawsuitSchema>
type NewLawsuit = z.infer<typeof insertLawsuitSchema>

export class LawsuitService {
  constructor(private db: typeof database) {}

  // simple
  async listLawsuits(
    pagination: PaginationInput,
  ): Promise<Paginated<typeof selectLawsuitSchema>> {
    const lawsuitsCount = await this.db.$count(lawsuit)

    const lawsuits = await this.db.query.lawsuit.findMany({
      with: { client: true },
      limit: pagination.limit,
      offset: pagination.offset,
    })

    return {
      data: lawsuits,
      total: lawsuitsCount,
      limit: pagination.limit,
      offset: pagination.offset,
    }
  }

  // simple
  async getByCNJ(cnj: string) {
    const ls = await this.db.query.lawsuit.findFirst({
      where: (lawsuit, { eq }) => eq(lawsuit.cnj, cnj),
      with: { client: true, movimentations: true },
    })
    return ls
  }

  async getById(id: string) {
    const ls = await this.db.query.lawsuit.findFirst({
      where: (lawsuit, { eq }) => eq(lawsuit.id, id),
      with: { client: true, movimentations: true },
    })
    return ls
  }

  async getByJudiceId(judiceId: number) {
    return await this.db.query.lawsuit.findFirst({
      where: (lawsuit, { eq }) => eq(lawsuit.judiceId, judiceId),
    })
  }

  async create(newLawsuit: NewLawsuit) {
    const [createdLawsuit] = await this.db
      .insert(lawsuit)
      .values(newLawsuit)
      .returning()

    return createdLawsuit
  }
}
