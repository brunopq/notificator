import type { RequestHandler } from "express"
import { inject } from "inversify"

import { MovimentationJudiceService } from "@/services/MovimentationJudiceService"
import { NotificationService } from "@/services/NotificationService"
import type { Notification } from "@/services/NotificationService"
import { PublicationJudiceService } from "@/services/PublicationJudiceService"

export class NotificationFetcherController {
  constructor(
    @inject(MovimentationJudiceService)
    private movimentationJudiceService: MovimentationJudiceService,
    @inject(NotificationService)
    private notificationService: NotificationService,
    @inject(PublicationJudiceService)
    private publicationJudiceService: PublicationJudiceService,
  ) {}

  fetchAndSendNotifications: RequestHandler = async (_, res) => {
    console.log(new Date().toLocaleString())
    const publications = await this.publicationJudiceService.fetchPublications()
    console.log(`${publications.length} publications open on Judice`)

    const movimentations =
      await this.movimentationJudiceService.fetchNewMovimentations()
    console.log(`${movimentations.length} new movimentations created`)

    const sentNotifications: Notification[] = []
    const notSentNotifications: Notification[] = []

    for (const mov of movimentations) {
      let notification: Notification
      try {
        notification = await this.notificationService.createInitialNotification(
          mov.id,
        )
      } catch (e) {
        console.log(e)
        console.error(
          `Could not create notification for movimentation ${mov.id}`,
        )
        continue
      }

      try {
        const { notification, schedule } =
          await this.notificationService.createReminderNotification(mov.id)
      } catch (e) {
        console.error(
          `Could not create reminder notification for movimentation ${mov.id}`,
        )
      }

      try {
        const sent = await this.notificationService.send(notification.id)
        console.log(`Notification ${notification.id} sent!`)

        sentNotifications.push(sent)
      } catch (e) {
        console.log(`Error sending notification ${notification.id}`)
        console.error(e)

        notSentNotifications.push(notification)
      }
    }

    console.log("Job executed")

    res.json({
      sentNotifications,
      notSentNotifications,
    })
  }
}
