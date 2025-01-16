import { NotFoundError } from "@/common/errors/HTTPError"
import type { LawsuitJudiceService } from "@/services/LawsuitJudiceService"
import type { MovimentationJudiceService } from "@/services/MovimentationJudiceService"
import type { MovimentationService } from "@/services/MovimentationService"
import type { NotificationService } from "@/services/NotificationService"
import { isBefore } from "date-fns"

/**
 * Searches for the lawsuit with the CNJ, checks if there has been a new movimentation and sends a notification.
 */
export class NotifyByLawsuitCNJ {
  constructor(
    private lawsuitJudiceService: LawsuitJudiceService,
    private movimentationJudiceService: MovimentationJudiceService,
    private movimentationService: MovimentationService,
    private notificationService: NotificationService,
  ) {}

  async execute(cnj: string) {
    const lawsuit = await this.lawsuitJudiceService.getOrCreateByCNJ(cnj)

    if (!lawsuit) {
      throw new NotFoundError(`Lawsuit ${cnj} not found`)
    }

    await this.movimentationJudiceService.fetchMovimentationsByLawsuit(lawsuit)

    const movimentations =
      await this.movimentationService.getMovimentationsByLawsuitId(lawsuit.id, {
        notifications: true,
      })

    for (const movimentation of movimentations) {
      if (isBefore(movimentation.finalDate, new Date()))
        // movimentation already happened
        continue

      if (movimentation.notifications.length > 0) {
        // notification already sent
        continue
      }

      const notification =
        await this.notificationService.createInitialNotification(
          movimentation.id,
        )

      const sent = await this.notificationService.send(notification.id)
    }
  }
}
