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
    const lawsuitJudiceId = await this.lawsuitJudiceService.getJudiceId(cnj)

    if (!lawsuitJudiceId) {
      throw new NotFoundError(`Lawsuit ${cnj} not found in Judice`)
    }

    const lawsuit =
      await this.lawsuitJudiceService.syncLawsuitWithJudice(lawsuitJudiceId)

    await this.movimentationJudiceService.fetchMovimentationsByLawsuit(lawsuit)

    const movimentations =
      await this.movimentationService.getMovimentationsByLawsuitId(lawsuit.id, {
        notifications: true,
      })

    let notificationsCreated = 0
    let notificationsSent = 0
    let errorSending = false

    for (const movimentation of movimentations) {
      if (isBefore(movimentation.finalDate, new Date()))
        // movimentation already happened
        continue

      if (movimentation.notifications.length > 0) {
        // notification already sent
        for (const notification of movimentation.notifications) {
          if (notification.sentAt) {
            // notification already sent, continue
            continue
          }

          // notification is scheduled, continue
          if (notification.isScheduled || notification.scheduleArn) {
            if (!(notification.isScheduled && notification.scheduleArn)) {
              // small warning if notification is inconsistent
              console.error(
                `Notification ${notification.id} is inconsistent: isScheduled=${notification.isScheduled}, scheduleArn=${notification.scheduleArn}`,
              )
            }
            continue
          }

          // notification is not sent and not scheduled
          try {
            await this.notificationService.send(notification.id)
            notificationsSent++
          } catch (e) {
            errorSending = true
            console.error(
              `Error while sending already created notification ${notification.id} for movimentation ${movimentation.id}`,
            )
          }
        }
        // don't create new notifications if some exist already
        continue
      }

      const notification =
        await this.notificationService.createInitialNotification(
          movimentation.id,
        )
      notificationsCreated++

      try {
        const sent = await this.notificationService.send(notification.id)
        notificationsSent++
      } catch (e) {
        errorSending = true
        console.error(
          `Error while sending notification ${notification.id} for movimentation ${movimentation.id}`,
        )
      }

      try {
        const { notification, schedule } =
          await this.notificationService.createReminderNotification(
            movimentation.id,
          )
      } catch (e) {
        console.error(
          `Could not create reminder notification for movimentation ${movimentation.id}`,
        )
      }
    }

    return {
      total: movimentations.length,
      created: notificationsCreated,
      sent: notificationsSent,
      errorSending,
    }
  }
}
