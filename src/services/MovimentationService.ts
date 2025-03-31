import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

import type { Paginated, PaginationInput } from "@/common/models/pagination";

import type { db as database } from "@/database";
import { movimentation } from "@/database/schema";

import type { Lawsuit, LawsuitWithClient } from "./LawsuitService";

const selectMovimentationSchema = createSelectSchema(movimentation);
export const insertMovimentationSchema = createInsertSchema(movimentation);

export type Movimentation = z.infer<typeof selectMovimentationSchema>;
export type MovimentationWithLawsuit = Movimentation & {
  lawsuit: Lawsuit;
};
export type MovimentationWithLawsuitWithClient = Movimentation & {
  lawsuit: LawsuitWithClient;
};
type NewMovimentation = z.infer<typeof insertMovimentationSchema>;

const movimentationWith: {
  lawsuit?: true;
  notifications?: true;
} = {};

export class MovimentationService {
  constructor(private db: typeof database) {}

  // simple
  /**
   * Returns a list of the movimentations in the database
   */
  async getMovimentations(
    pagination: PaginationInput
  ): Promise<Paginated<typeof selectMovimentationSchema>> {
    const movimentationCount = await this.db.$count(movimentation);
    const movimentations = await this.db.query.movimentation.findMany({
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      data: movimentations,
      total: movimentationCount,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  // simple
  /**
   * Returns a list of the movimentations in the database, with all the fields
   */
  async getFullMovimentations() {
    return await this.db.query.movimentation.findMany({
      with: {
        lawsuit: { with: { client: true } },
      },
    });
  }

  async getMovimentationsByLawsuitId(
    lawsuitId: string,
    include = movimentationWith
  ) {
    return await this.db.query.movimentation.findMany({
      where: (movimentation, { eq }) => eq(movimentation.lawsuitId, lawsuitId),
      with: {
        lawsuit: include.lawsuit,
        notifications: include.notifications,
      },
    });
  }

  // simple
  /**
   * Returns the movimentation by id, with all the fields
   */
  async getFullMovimentationById(id: string) {
    return await this.db.query.movimentation.findFirst({
      with: { lawsuit: { with: { client: true } }, notifications: true },
      where: (movimentation, { eq }) => eq(movimentation.id, id),
    });
  }

  // simple
  /**
   * Returns the movimentation by judiceId
   */
  async getMovimentationByJudiceId(judiceId: number) {
    return await this.db.query.movimentation.findFirst({
      where: (movimentation, { eq }) => eq(movimentation.judiceId, judiceId),
    });
  }

  // simple
  async createMovimentation(newMovimentation: NewMovimentation) {
    const [createdMovimentation] = await this.db
      .insert(movimentation)
      .values(newMovimentation)
      .returning();

    return createdMovimentation;
  }

  async updateMovimentation(
    id: string,
    newMovimentation: Partial<Movimentation>
  ) {
    const [updatedMovimentation] = await this.db
      .update(movimentation)
      .set(newMovimentation)
      .where(eq(movimentation.id, id))
      .returning();

    return updatedMovimentation;
  }
}
