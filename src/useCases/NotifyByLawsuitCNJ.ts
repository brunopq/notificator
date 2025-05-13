import { isBefore } from "date-fns"

import { NotFoundError } from "@/common/errors/HTTPError"
import type { LawsuitJudiceService } from "@/services/LawsuitJudiceService"
import type { MovimentationJudiceService } from "@/services/MovimentationJudiceService"
import type { MovimentationService } from "@/services/MovimentationService"
import type { NotificationService } from "@/services/NotificationService"

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

  private async handleMovimentation(
    movimentationId: string,
    executionId: string,
  ) {
    const fullMovimentation =
      await this.movimentationService.getFullMovimentationById(movimentationId)

    if (!fullMovimentation) {
      throw new NotFoundError(`Movimentation ${movimentationId} not found`)
    }

    if (!fullMovimentation.isActive) {
      // movimentation is not active
      console.log(`Movimentation ${movimentationId} is not active`)
      return { notifications: { created: 0, sent: 0, total: 0, error: 0 } }
    }

    if (isBefore(fullMovimentation.finalDate, new Date())) {
      // movimentation already happened
      console.log(`Movimentation ${movimentationId} already happened`)
      return { notifications: { created: 0, sent: 0, total: 0, error: 0 } }
    }

    let notificationsCreated = 0
    let notificationsError = 0
    let notificationsSent = 0

    if (fullMovimentation.notifications.length === 0) {
      console.log(`Creating notifications for movimentation ${movimentationId}`)
      await this.notificationService.createInitialNotification(movimentationId)
      notificationsCreated++

      try {
        await this.notificationService.createReminderNotification(
          movimentationId,
        )
        notificationsCreated++
      } catch (e) {
        console.log(
          `Could not create reminder notification for movimentation ${movimentationId}`,
        )
      }
    }

    const notifications =
      await this.notificationService.getForMovimentation(movimentationId)

    for (const notification of notifications) {
      if (notification.status === "NOT_SENT") {
        try {
          await this.notificationService.send(notification.id)
          notificationsSent++
        } catch (e) {
          console.log(e)
          notificationsError++
        }
      } else if (notification.status === "SENT") {
        // notification already sent, not now but in the past
        notificationsSent++
      } else if (notification.status === "ERROR") {
        // notification failed to send
        notificationsError++
      }

      const snapshot = await this.notificationService.createSnapshot(
        notification.id,
        executionId,
      )
    }

    return {
      notifications: {
        created: notificationsCreated,
        sent: notificationsSent,
        total: notifications.length,
        error: notificationsError,
      },
    }
  }

  async execute(cnj: string, executionId: string) {
    const lawsuitJudiceId = await this.lawsuitJudiceService.getJudiceId(cnj)

    if (!lawsuitJudiceId) {
      throw new NotFoundError(`Lawsuit ${cnj} not found in Judice`)
    }

    const lawsuit =
      await this.lawsuitJudiceService.syncLawsuitWithJudice(lawsuitJudiceId)
    console.log(lawsuit)

    const movimentations =
      await this.movimentationJudiceService.fetchMovimentationsByLawsuit(
        lawsuit,
      )

    console.log(
      `Found ${movimentations.length} movimentations in lawsuit ${cnj}`,
    )

    const movimentationsResult = await Promise.all(
      movimentations.map(async (movimentation) => ({
        movimentationId: movimentation.id,
        ...(await this.handleMovimentation(movimentation.id, executionId)),
      })),
    )

    return movimentationsResult
  }
}
