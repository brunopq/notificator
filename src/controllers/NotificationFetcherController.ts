import { format } from "date-fns"
import type { RequestHandler } from "express"

import MovimentationService from "@/services/MovimentationService"
import NotificationService from "@/services/NotificationService"
import type { Notification } from "@/services/NotificationService"
import PublicationsService from "@/services/PublicationsService"

class NotificationFetcherController {
  constructor(
    private movimentationService: typeof MovimentationService,
    private notificationService: typeof NotificationService,
    private publicationsService: typeof PublicationsService,
  ) {}

  fetchAndSendNotifications: RequestHandler = async (_, res) => {
    console.log(new Date().toLocaleString())
    const publications = await this.publicationsService.fetchPublications()
    console.log(`${publications.length} publications open on Judice`)

    const movimentations =
      await this.movimentationService.fetchNewMovimentations()
    console.log(`${movimentations.length} new movimentations created`)

    const sentNotifications: Notification[] = []
    const notSentNotifications: Notification[] = []

    for (const mov of movimentations) {
      const fullMovimentation =
        await this.movimentationService.getFullMovimentationById(mov.id)

      if (!fullMovimentation) {
        console.log(`Movimentation ${mov.id} not found (???)`)
        continue
      }

      let clientName = fullMovimentation.lawsuit.client.name.split(" ")[0]

      if (!clientName) {
        console.log("Client does not have a name")
        continue
      }

      clientName =
        clientName.charAt(0).toLocaleUpperCase() +
        clientName.toLocaleLowerCase().slice(1)

      const notification = await this.notificationService.create({
        movimentationId: fullMovimentation.id,
        clientId: fullMovimentation.lawsuit.client.id,
        message: `Olá, ${clientName}. Estamos entrando em contato pois foi agendada uma ${fullMovimentation.type === "AUDIENCIA" ? "audiência" : "perícia"} em seu processo para o dia ${format(fullMovimentation.finalDate, "dd/MM/yyyy")}. Para mais informações estamos a sua disposição.`,
        sent: false,
        recieved: false,
      })

      console.log(`Notification ${notification.id} created`)

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

export default new NotificationFetcherController(
  MovimentationService,
  NotificationService,
  PublicationsService,
)
