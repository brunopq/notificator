import { CronJob } from "cron"

import MovimentationService from "@/services/MovimentationService"
import NotificationService from "@/services/NotificationService"
import PublicationsService from "@/services/PublicationsService"

import { env } from "@/common/utils/envConfig"
import { app } from "@/server"
import { format } from "date-fns"

app.listen(env.PORT, () => {
  const { NODE_ENV, HOST, PORT } = env
  console.log(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`)
})

const job = CronJob.from({
  cronTime: "*/2 * * * *",
  onTick: async () => {
    console.log(new Date().toLocaleString())
    const publications = await PublicationsService.fetchPublications()
    console.log(`${publications.length} publications open on Judice`)
    const movimentations = await MovimentationService.fetchNewMovimentations()
    console.log(`${movimentations.length} new movimentations created`)

    for (const mov of movimentations) {
      const fullMovimentation =
        await MovimentationService.getFullMovimentationById(mov.id)

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

      const notification = await NotificationService.create({
        movimentationId: fullMovimentation.id,
        clientId: fullMovimentation.lawsuit.client.id,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        message: `Olá, ${clientName}. Estamos entrando em contato pois foi agendada uma ${fullMovimentation.type === "AUDIENCIA" ? "audiência" : "perícia"} em seu processo para o dia ${format(fullMovimentation.finalDate!, "dd/MM/yyyy")}. Para mais informações estamos a sua disposição.`,
        sent: false,
        recieved: false,
      })

      console.log(`Notification ${notification.id} created`)

      try {
        const sent = await NotificationService.send(notification.id)

        console.log("Sent: ", sent)
      } catch (e) {
        console.log("Error sending notification")
        console.error(e)
      }
    }

    console.log("Job executed")
  },
})

job.start()
