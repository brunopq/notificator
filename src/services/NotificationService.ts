import { tz } from "@date-fns/tz"
import { format, isBefore, subWeeks } from "date-fns"
import { eq } from "drizzle-orm"
import { createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import type { Paginated, PaginationInput } from "@/common/models/pagination"

import type { db as database } from "@/database"
import {
  notification,
  notificationErrors,
  notificationSnapshot,
  notificationStatus,
} from "@/database/schema"

import type { ClientJudiceService } from "./ClientJudiceService"
import { selectClientSchema } from "./ClientService"
import type {
  MovimentationService,
  MovimentationWithLawsuitWithClient,
} from "./MovimentationService"
import type { SchedulerService } from "./SchedulerService"
import type { WhatsappService } from "./WhatsappService"

const selectNotificationSchema = createSelectSchema(notification)
const notificationWithClientSchema = selectNotificationSchema.extend({
  client: selectClientSchema,
})
const notificationErrorsSchema = z.enum(notificationErrors.enumValues)
const notificationStatusSchema = z.enum(notificationStatus.enumValues)
export const insertNotificationSchema = z.object({
  movimentationId: z.string(),
  clientId: z.string(),
  message: z.string(),
  sentAt: z.date().nullish(),
  recieved: z.boolean().default(false),
  scheduleArn: z.string().nullish(),
  status: notificationStatusSchema,
  error: notificationErrorsSchema.nullish(),
})

export type Notification = z.infer<typeof selectNotificationSchema>
type NewNotification = z.infer<typeof insertNotificationSchema>

export class NotificationService {
  constructor(
    private db: typeof database,
    private whatsappService: WhatsappService,
    private movimentationService: MovimentationService,
    private clientJudiceService: ClientJudiceService,
    private schedulerService: SchedulerService,
  ) {}

  async index(
    pagination: PaginationInput,
  ): Promise<Paginated<typeof notificationWithClientSchema>> {
    const notificationsCount = await this.db.$count(notification)
    const notifications = await this.db.query.notification.findMany({
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

  async getForMovimentation(movimentationId: string) {
    const notifications = await this.db.query.notification.findMany({
      where: (n, { eq }) => eq(n.movimentationId, movimentationId),
      with: { client: true },
    })

    return notifications
  }

  async show(id: string) {
    const notification = await this.db.query.notification.findFirst({
      where: (n, { eq }) => eq(n.id, id),
      with: { client: true, movimentation: true },
    })

    if (!notification) {
      return undefined
    }

    return notification
  }

  async create(newNotification: NewNotification) {
    const [createdNotification] = await this.db
      .insert(notification)
      .values(newNotification)
      .returning()

    return createdNotification
  }

  async update(id: string, data: Partial<Notification>) {
    const [updated] = await this.db
      .update(notification)
      .set(data)
      .where(eq(notification.id, id))
      .returning()

    return updated
  }

  public createInitialNotificationMessage(
    mov: MovimentationWithLawsuitWithClient,
  ): string {
    let clientName = mov.lawsuit.client.name.split(" ")[0]
    clientName =
      clientName.charAt(0).toLocaleUpperCase() +
      clientName.toLocaleLowerCase().slice(1)
    const cnj = mov.lawsuit.cnj
    const dateWithTime = format(mov.finalDate, "dd/MM/yyyy, HH:mm", {
      in: tz("America/Sao_Paulo"),
    })

    const movimentationType = mov.type === "AUDIENCIA" ? "audiência" : "perícia"

    let message = `Olá, ${clientName}. Estamos entrando em contato pois foi agendada uma ${movimentationType} no seu processo ${cnj} para o dia ${dateWithTime}.\n`
    if (mov.type === "AUDIENCIA") {
      message += `Para sua ${movimentationType}, você vai precisar de tesemunhas, então procure entrar em contato com seus colegas de trabalho com antecedência.\n`
    } else {
    }
    message += `Perto da data da ${movimentationType} enviaremos outra notificação com mais detalhes. Para mais informações estamos a sua disposição.`

    return message
  }

  async createInitialNotification(movimentationId: string) {
    const fullMovimentation =
      await this.movimentationService.getFullMovimentationById(movimentationId)

    if (!fullMovimentation) {
      console.log(`Movimentation ${movimentationId} not found`)
      throw new Error("Movimentation not found")
    }

    const notification = await this.create({
      movimentationId: fullMovimentation.id,
      clientId: fullMovimentation.lawsuit.client.id,
      message: this.createInitialNotificationMessage(fullMovimentation),
      recieved: false,
      status: "NOT_SENT",
    })

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
      message: `Olá, ${clientName}. Estamos enviando essa mensagem pois há uma ${
        fullMovimentation.type === "AUDIENCIA" ? "audiência" : "perícia"
      } agendada em seu processo ${
        fullMovimentation.lawsuit.cnj
      } para o dia ${format(fullMovimentation.finalDate, "dd/MM/yyyy", {
        in: tz("America/Sao_Paulo"),
      })}, duas semanas a partir de hoje.`,
      recieved: false,
      status: "NOT_SENT",
    })

    const schedule = await this.schedulerService.scheduleNotificationSending(
      notificationScheduledDate,
      notification.id,
    )

    await this.update(notification.id, {
      scheduleArn: schedule.scheduleArn,
      status: "SCHEDULED",
    })

    return { notification, schedule }
  }

  async send(id: string) {
    console.log(`Sending notification ${id}...`)
    const noti = await this.db.query.notification.findFirst({
      where: (n, { eq }) => eq(n.id, id),
      with: { client: true },
    })

    if (!noti) {
      throw new Error("Notification not found")
    }

    if (noti.status !== "NOT_SENT") {
      throw new Error(
        "Cannot send notification with status different from NOT_SENT",
      )
    }

    // sync the client to fetch the latest phone number
    let client = noti.client
    try {
      client = await this.clientJudiceService.syncClientWithJudice(
        noti.client.judiceId,
      )
    } catch (e) {
      console.error(`Error syncing client ${noti.client.id}`)
    }

    if (client.phones.length === 0) {
      console.warn(
        `Client ${client.id} has no phones. Notification ${noti.id} not sent`,
      )
      await this.update(id, {
        status: "ERROR",
        error: "NO_PHONE_NUMBER",
      })
      throw new Error("Client has no phones")
    }

    const phone = noti.client.phones[0]

    const sentMessage = await this.whatsappService.sendMessage(
      phone,
      noti.message,
    )

    if (sentMessage.error === "not_on_whatsapp") {
      await this.update(id, {
        status: "ERROR",
        error: "PHONE_NOT_ON_WHATSAPP",
      })

      throw new Error("Message not sent")
    }
    if (sentMessage.error === "unknown") {
      await this.update(id, {
        status: "WILL_RETRY",
        error: "UNKNOWN_ERROR",
      })

      throw new Error("Message not sent")
    }

    const updated = await this.update(id, {
      sentAt: new Date(),
      status: "SENT",
      error: null,
    })

    console.log(`Notification ${id} sent!`)

    return updated
  }

  async createSnapshot(notificationId: string, executionId: string) {
    const notification = await this.show(notificationId)

    if (!notification) {
      return null
    }

    const snapshot = await this.db.insert(notificationSnapshot).values({
      notificationId,
      executionId,
      status: notification.status,
      error: notification.error,
    })

    return snapshot
  }
}
