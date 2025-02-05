import { format, isBefore, subWeeks } from "date-fns"
import { eq } from "drizzle-orm"
import { createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import type { Paginated, PaginationInput } from "@/common/models/pagination"

import { db } from "@/database"
import { notification } from "@/database/schema"

import type { ClientJudiceService } from "./ClientJudiceService"
import { selectClientSchema } from "./ClientService"
import type { MovimentationService } from "./MovimentationService"
import type { WhatsappService } from "./OfficialWhatsappService"
import type { SchedulerService } from "./SchedulerService"

const selectNotificationSchema = createSelectSchema(notification)
const notificationWithClientSchema = selectNotificationSchema.extend({
  client: selectClientSchema,
})
export const insertNotificationSchema = z.object({
  movimentationId: z.string(),
  clientId: z.string(),
  message: z.string(),
  sentAt: z.date().nullish(),
  recieved: z.boolean().default(false),
})

export type Notification = z.infer<typeof selectNotificationSchema>
type NewNotification = z.infer<typeof insertNotificationSchema>

export class NotificationService {
  constructor(
    private whatsappService: WhatsappService,
    private movimentationService: MovimentationService,
    private clientJudiceService: ClientJudiceService,
    private schedulerService: SchedulerService,
  ) {}

  async index(
    pagination: PaginationInput,
  ): Promise<Paginated<typeof notificationWithClientSchema>> {
    const notificationsCount = await db.$count(notification)
    const notifications = await db.query.notification.findMany({
      with: { client: true },
      limit: pagination.limit,
      offset: pagination.offset,
    })

    return {
      data: notifications,
      total: notificationsCount,
      limit: pagination.limit,
      offset: pagination.offset,
    }
  }

  async show(id: string) {
    const notification = await db.query.notification.findFirst({
      where: (n, { eq }) => eq(n.id, id),
      with: { client: true, movimentation: true },
    })

    if (!notification) {
      return undefined
    }

    return notification
  }

  async create(newNotification: NewNotification) {
    const [createdNotification] = await db
      .insert(notification)
      .values(newNotification)
      .returning()

    return createdNotification
  }

  async update(id: string, data: Partial<Notification>) {
    const [updated] = await db
      .update(notification)
      .set(data)
      .where(eq(notification.id, id))
      .returning()

    return updated
  }

  async createInitialNotification(movimentationId: string) {
    const fullMovimentation =
      await this.movimentationService.getFullMovimentationById(movimentationId)

    if (!fullMovimentation) {
      console.log(`Movimentation ${movimentationId} not found`)
      throw new Error("Movimentation not found")
    }

    let clientName = fullMovimentation.lawsuit.client.name.split(" ")[0]

    if (!clientName) {
      console.log("Client does not have a name")
      throw new Error("Client does not have a name")
    }

    clientName =
      clientName.charAt(0).toLocaleUpperCase() +
      clientName.toLocaleLowerCase().slice(1)

    const movimentationType =
      fullMovimentation.type === "AUDIENCIA" ? "audiência" : "perícia"

    const notification = await this.create({
      movimentationId: fullMovimentation.id,
      clientId: fullMovimentation.lawsuit.client.id,
      message: `Olá, ${clientName}. Estamos entrando em contato pois foi agendada uma ${movimentationType} no seu processo ${fullMovimentation.lawsuit.cnj} para o dia ${format(fullMovimentation.finalDate, "dd/MM/yyyy")}.\nPerto da data da ${movimentationType} enviaremos outra notificação com mais detalhes. Para mais informações estamos a sua disposição.`,
      recieved: false,
    })

    console.log(`Notification ${notification.id} created`)

    return notification
  }

  async createReminderNotification(movimentationId: string) {
    const fullMovimentation =
      await this.movimentationService.getFullMovimentationById(movimentationId)

    if (!fullMovimentation) {
      console.log(`Movimentation ${movimentationId} not found`)
      throw new Error("Movimentation not found")
    }

    let clientName = fullMovimentation.lawsuit.client.name.split(" ")[0]

    if (!clientName) {
      console.log("Client does not have a name")
      throw new Error("Client does not have a name")
    }

    clientName =
      clientName.charAt(0).toLocaleUpperCase() +
      clientName.toLocaleLowerCase().slice(1)

    const notificationScheduledDate = subWeeks(
      new Date(fullMovimentation.finalDate),
      2,
    )

    if (isBefore(notificationScheduledDate, new Date())) {
      console.log("Notification scheduled date is in the past")
      throw new Error("Notification scheduled date is in the past")
    }

    const notification = await this.create({
      movimentationId: fullMovimentation.id,
      clientId: fullMovimentation.lawsuit.client.id,
      message: `Olá, ${clientName}. Estamos enviando essa mensagem pois há uma ${fullMovimentation.type === "AUDIENCIA" ? "audiência" : "perícia"} agendada em seu processo ${fullMovimentation.lawsuit.cnj} para o dia ${format(fullMovimentation.finalDate, "dd/MM/yyyy")}, duas semanas a partir de hoje.`,
      recieved: false,
    })

    const schedule = await this.schedulerService.scheduleNotificationSending(
      notificationScheduledDate,
      notification.id,
    )

    await this.update(notification.id, {
      scheduleArn: schedule.scheduleArn,
      isScheduled: true,
    })

    return { notification, schedule }
  }

  async send(id: string) {
    const noti = await db.query.notification.findFirst({
      where: (n, { eq }) => eq(n.id, id),
      with: { client: true },
    })

    if (!noti) {
      throw new Error("Notification not found")
    }

    if (noti.sentAt) {
      throw new Error("Notification already sent")
    }

    // sync the client to fetch the latest phone number
    const client = await this.clientJudiceService.syncClientWithJudice(
      noti.client.judiceId,
    )

    if (client.phones.length === 0) {
      console.warn(
        `Client ${client.id} has no phones. Notification ${noti.id} not sent`,
      )
      throw new Error("Client has no phones")
    }

    const phone = noti.client.phones[0]

    const sentMessage = await this.whatsappService.sendMessage(
      phone,
      noti.message,
    )

    console.log(sentMessage)

    if (!sentMessage) {
      throw new Error("Message not sent")
    }

    const updated = this.update(id, {
      sentAt: new Date(),
      scheduleArn: null,
      isScheduled: false,
    })

    return updated
  }
}
