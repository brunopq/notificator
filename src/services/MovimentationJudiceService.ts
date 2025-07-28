import { isAfter } from "date-fns"
import { inject, injectable } from "inversify"

import { JudiceService } from "./JudiceService"
import type { Lawsuit } from "./LawsuitService"
import {
  type Movimentation,
  MovimentationService,
} from "./MovimentationService"
import { PublicationJudiceService } from "./PublicationJudiceService"
import { PublicationsService } from "./PublicationsService"

@injectable()
export class MovimentationJudiceService {
  constructor(
    @inject(MovimentationService)
    private movimentationService: MovimentationService,
    @inject(JudiceService) private judiceService: JudiceService,
    @inject(PublicationsService)
    private publicationsService: PublicationsService,
    @inject(PublicationJudiceService)
    private publicationJudiceService: PublicationJudiceService,
  ) {}

  async fetchMovimentationsByLawsuit(lawsuit: Lawsuit) {
    const movimentations = await this.judiceService.getAudienciasByJudiceId(
      lawsuit.judiceId,
    )

    console.log(
      `${movimentations.length} movimentations found in judice for lawsuit ${lawsuit.cnj}`,
    )

    return await Promise.all(
      movimentations.map(async (movimentation) => {
        if (
          !movimentation ||
          !movimentation.date ||
          !movimentation.judiceId ||
          !movimentation.lastModification
        ) {
          console.log("Invalid movimentation", movimentation)
          throw new Error("Invalid movimentation")
        }

        const dbMovimentation =
          await this.movimentationService.getMovimentationByJudiceId(
            movimentation.judiceId,
          )

        if (!dbMovimentation) {
          const newMovimentation =
            await this.movimentationService.createMovimentation({
              judiceId: movimentation.judiceId,
              type:
                movimentation.type === "audiencia" ? "AUDIENCIA" : "PERICIA",
              variant: movimentation.variant,
              expeditionDate: movimentation.lastModification,
              finalDate: movimentation.date,
              lawsuitId: lawsuit.id,
              isActive: movimentation.isActive,
              link: movimentation.link,
            })
          return newMovimentation
        }

        return await this.movimentationService.updateMovimentation(
          dbMovimentation.id,
          {
            isActive: movimentation.isActive,
          },
        )
      }),
    )
  }

  /**
   * Updates the publcations that have been read and
   * creates the movimentations, if they happened.
   */
  async fetchNewMovimentations() {
    const closedPublications =
      await this.publicationJudiceService.fetchClosedPublications()

    console.log(`${closedPublications.length} closed publications`)

    const promises = closedPublications.map((p, i) =>
      (async () => {
        const audiencias = await this.judiceService.getAudienciasByJudiceId(
          p.lawsuit.judiceId,
        )

        // the movimentation that happened because of the publication
        const createdAudiencia = audiencias.find((a) =>
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          isAfter(a.lastModification!, p.expeditionDate),
        )

        if (
          !createdAudiencia ||
          !createdAudiencia.date ||
          !createdAudiencia.judiceId ||
          !createdAudiencia.lastModification
        ) {
          return null
        }

        const dbMovimentation =
          await this.movimentationService.getMovimentationByJudiceId(
            createdAudiencia.judiceId,
          )

        // don't create movimentation twice
        // don't return it to not notify the client twice
        if (dbMovimentation) {
          return null
        }

        const newMovimentation =
          await this.movimentationService.createMovimentation({
            judiceId: createdAudiencia.judiceId,
            type:
              createdAudiencia.type === "audiencia" ? "AUDIENCIA" : "PERICIA",
            variant: createdAudiencia.variant,
            expeditionDate: createdAudiencia.lastModification,
            finalDate: createdAudiencia.date,
            lawsuitId: p.lawsuitId,
            isActive: createdAudiencia.isActive,
            link: createdAudiencia.link,
          })

        // sets the movimentation id
        closedPublications[i].movimentationId = newMovimentation.id

        return newMovimentation
      })(),
    )

    const results = await Promise.allSettled(promises)

    for (const r of results) {
      if (r.status === "rejected") {
        console.log(r.reason)
      }
    }

    const created = results
      .filter((r) => r.status === "fulfilled")
      .filter((r) => r.value !== null) // strips off null
      .map((r) => r.value) as Movimentation[] // strips off null from typescript

    // updates publications statuses
    await Promise.all(
      closedPublications.map((p) =>
        this.publicationsService.update(p.id, { ...p, hasBeenTreated: true }),
      ),
    )

    return created
  }
}
