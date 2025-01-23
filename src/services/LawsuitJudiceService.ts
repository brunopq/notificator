import type { ClientJudiceService } from "./ClientJudiceService"
import type { JudiceService } from "./JudiceService"
import type { LawsuitService } from "./LawsuitService"
import type { MovimentationService } from "./MovimentationService"

export class LawsuitJudiceService {
  constructor(
    private lawsuitService: LawsuitService,
    private judiceService: JudiceService,
    private clientJudiceService: ClientJudiceService,
    private movimentationService: MovimentationService,
  ) {}

  async getJudiceId(cnj: string) {
    const lawsuit = await this.judiceService.searchLawsuitByCNJ(cnj)
    if (!lawsuit) {
      return null
    }
    return lawsuit.f_id
  }

  async syncLawsuitWithJudice(judiceId: number) {
    const lawsuitInfo =
      await this.judiceService.lawsuitWithMovimentationsByJudiceId(judiceId)

    const dbLawsuit = await this.lawsuitService.getByJudiceId(judiceId)

    const client = await this.clientJudiceService.syncClientWithJudice(
      lawsuitInfo.clientId,
    )

    // TODO: sync movimentations too

    if (!dbLawsuit) {
      return this.lawsuitService.create({
        judiceId,
        clientId: client.id,
        cnj: lawsuitInfo.cnj,
      })
    }

    // not that this info should ever change, but if we add more fields
    // to the lawsuit, we can just put them here
    return this.lawsuitService.update(dbLawsuit.id, {
      clientId: client.id,
      cnj: lawsuitInfo.cnj,
    })
  }

  async getOrCreateByCNJ(cnj: string) {
    const dbLawsuit = await this.lawsuitService.getByCNJ(cnj)

    if (dbLawsuit) {
      return dbLawsuit
    }

    const judiceLawsuit = await this.judiceService.searchLawsuitByCNJ(cnj)

    if (!judiceLawsuit) {
      return null
    }

    return this.getOrCreateByJudiceId(judiceLawsuit.f_id)
  }

  async getOrCreateByJudiceId(judiceId: number) {
    const dbLawsuitJudiceId = await this.lawsuitService.getByJudiceId(judiceId)

    if (dbLawsuitJudiceId) {
      return dbLawsuitJudiceId
    }

    const judiceLawsuit =
      await this.judiceService.lawsuitWithMovimentationsByJudiceId(judiceId)

    if (!judiceLawsuit) {
      throw new Error("Judice lawsuit not found")
    }

    const client = await this.clientJudiceService.syncClientWithJudice(
      judiceLawsuit.clientId,
    )

    if (!client) {
      return null
    }

    const createdLawsuit = await this.lawsuitService.create({
      judiceId: judiceId,
      clientId: client.id,
      cnj: judiceLawsuit.cnj,
    })

    for (const movimentation of judiceLawsuit.movimentations) {
      if (
        !movimentation.date ||
        !movimentation.lastModification ||
        !movimentation.type ||
        !movimentation.judiceId
      ) {
        console.error("Invalid movimentation", movimentation)
        continue
      }

      const newMov = await this.movimentationService.createMovimentation({
        judiceId: movimentation.judiceId,
        expeditionDate: movimentation.lastModification,
        finalDate: movimentation.date,
        type: movimentation.type === "audiencia" ? "AUDIENCIA" : "PERICIA",
        lawsuitId: createdLawsuit.id,
      })
    }

    console.log(`Created lawsuit ${createdLawsuit.cnj}`)

    return createdLawsuit
  }
}
