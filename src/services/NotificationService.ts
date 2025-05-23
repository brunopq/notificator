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
import type { IWhatsappService } from "./IWhatsappService"
import type {
  MovimentationService,
  MovimentationWithLawsuitWithClient,
} from "./MovimentationService"
import type { SchedulerService } from "./SchedulerService"

const selectNotificationSchema = createSelectSchema(notification)
const notificationWithClientSchema = selectNotificationSchema.extend({
  client: selectClientSchema,
})
export const notificationErrorsSchema = z.enum(notificationErrors.enumValues)
export const notificationStatusSchema = z.enum(notificationStatus.enumValues)

export type NotificationStatus = z.infer<typeof notificationStatusSchema>

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

export type NotificationError = z.infer<typeof notificationErrorsSchema>

type NotificationData = {
  clientName: string
  lawsuitCNJ: string
  formatedDate: string
  formatedTime: string
}
type ReminderNotificationData = NotificationData & {
  timeFromNow: number
  timeUnit: "dias" | "semanas"
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class NotificationMessageFactory {
  static create(
    mov: MovimentationWithLawsuitWithClient,
    type: "initial" | "reminder" = "initial",
  ) {
    let clientName = mov.lawsuit.client.name.split(" ")[0]
    clientName =
      clientName.charAt(0).toLocaleUpperCase() +
      clientName.toLocaleLowerCase().slice(1)
    const lawsuitCNJ = mov.lawsuit.cnj
    const formatedDate = format(mov.finalDate, "dd/MM/yyyy", {
      in: tz("America/Sao_Paulo"),
    })
    const formatedTime = format(mov.finalDate, "HH:mm", {
      in: tz("America/Sao_Paulo"),
    })

    const data = {
      clientName,
      lawsuitCNJ,
      formatedDate,
      formatedTime,
      timeUnit: "semanas",
      timeFromNow: 2,
    } satisfies ReminderNotificationData

    let fn: ((data: ReminderNotificationData) => string) | null = null

    if (mov.type === "AUDIENCIA" && type === "initial") {
      fn = NotificationMessageFactory.initialAudienciaNotification
    }
    if (mov.type === "AUDIENCIA" && type === "reminder") {
      fn = NotificationMessageFactory.reminderAudienciaNotification
    } else if (mov.type === "PERICIA" && type === "initial") {
      fn = NotificationMessageFactory.initialPericiaNotification
    } else if (mov.type === "PERICIA" && type === "reminder") {
      fn = NotificationMessageFactory.reminderPericiaNotification
    }

    if (fn === null) throw new Error("Unsuported movimentation")

    return fn(data)
  }

  private static reminderAudienciaNotification(d: ReminderNotificationData) {
    return `Olá, ${d.clientName}. Estamos enviando essa mensagem pois há uma audiência agendada em seu processo n.º ${d.lawsuitCNJ} para o dia ${d.formatedDate}, às ${d.formatedTime}, ${d.timeFromNow} ${d.timeUnit} a partir de hoje.`
  }

  private static reminderPericiaNotification(d: ReminderNotificationData) {
    return `Olá, ${d.clientName}. Estamos enviando essa mensagem pois há uma perícia agendada em seu processo n.º ${d.lawsuitCNJ} para o dia ${d.formatedDate}, às ${d.formatedTime}, ${d.timeFromNow} ${d.timeUnit} a partir de hoje.`
  }

  private static initialAudienciaNotification(d: NotificationData) {
    return `Olá, ${d.clientName}. Somos do escritório Iboti Advogados e estamos entrando em contato porque foi agendada uma audiência no seu processo n.º ${d.lawsuitCNJ}, marcada para o dia ${d.formatedDate}, às ${d.formatedTime}.

Você precisa providenciar testemunhas para esta audiência, podendo ser até 3 pessoas. Encaminhe-nos o nome completo e o telefone para contato das testemunhas e aguarde o nosso contato para fornecer demais orientações e informações necessárias.`
  }

  private static initialPericiaNotification(d: NotificationData) {
    return `Olá, ${d.clientName}. Somos do escritório Iboti Advogados e estamos entrando em contato porque foi agendada uma perícia no seu processo n.º ${d.lawsuitCNJ}, marcada para o dia ${d.formatedDate}, às ${d.formatedTime}.

Se tiver alguma dúvida, estamos disponíveis para fornecer demais orientações e informações necessárias.`
  }
}

export class NotificationService {
  constructor(
    private db: typeof database,
    private whatsappService: IWhatsappService,
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

  async createInitialNotification(movimentationId: string) {
    const fullMovimentation =
      await this.movimentationService.getFullMovimentationById(movimentationId)

    if (!fullMovimentation) {
      console.log(`Movimentation ${movimentationId} not found`)
      throw new Error("Movimentation not found")
    }

    const message = NotificationMessageFactory.create(fullMovimentation)

    const notification = await this.create({
      movimentationId: fullMovimentation.id,
      clientId: fullMovimentation.lawsuit.client.id,
      message,
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
      message: NotificationMessageFactory.create(fullMovimentation, "reminder"),
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

    if (noti.status !== "NOT_SENT" && noti.status !== "WILL_RETRY") {
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
