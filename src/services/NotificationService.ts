import { isBefore, subWeeks } from "date-fns"
import { eq } from "drizzle-orm"
import { inject, injectable } from "inversify"

import type { Paginated, PaginationInput } from "@/common/models/pagination"

import type { db as database } from "@/database"
import { notification, notificationSnapshot } from "@/database/schema"

import type {
  NewNotification,
  Notification,
  notificationWithClientSchema,
} from "@/models/Notification"
import { ClientJudiceService } from "./ClientJudiceService"
import type { IWhatsappService } from "./IWhatsappService"
import { MovimentationService } from "./MovimentationService"
import { SchedulerService } from "./SchedulerService"
import { TemplateService } from "./TemplateService"

function formatName(name: string): string {
  const firstName = name.split(" ")[0]

  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
}

@injectable()
export class NotificationService {
  constructor(
    @inject("database") private readonly db: typeof database,
    @inject("IWhatsappService")
    private readonly whatsappService: IWhatsappService,
    @inject(MovimentationService)
    private readonly movimentationService: MovimentationService,
    @inject(ClientJudiceService)
    private readonly clientJudiceService: ClientJudiceService,
    @inject(SchedulerService)
    private readonly schedulerService: SchedulerService,
    @inject(TemplateService)
    private readonly templateService: TemplateService,
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

    if (fullMovimentation.variant === "conciliacao") {
      console.log(
        `Movimentation ${movimentationId} is of type "conciliacao", skipping notification creation`,
      )
      return null
    }

    // TODO: make this into a factory or something
    let message: string
    if (fullMovimentation.link) {
      const renderer =
        fullMovimentation.type === "AUDIENCIA"
          ? this.templateService.renderRemoteAudiencia
          : this.templateService.renderRemotePericia

      message = renderer({
        clientName: formatName(fullMovimentation.lawsuit.client.name),
        CNJ: fullMovimentation.lawsuit.cnj,
        date: fullMovimentation.finalDate,
        link: fullMovimentation.link,
      })
    } else {
      const renderer =
        fullMovimentation.type === "AUDIENCIA"
          ? this.templateService.renderAudiencia
          : this.templateService.renderPericia

      message = renderer({
        clientName: formatName(fullMovimentation.lawsuit.client.name),
        CNJ: fullMovimentation.lawsuit.cnj,
        date: fullMovimentation.finalDate,
      })
    }

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

    if (fullMovimentation.variant === "conciliacao") {
      console.log(
        `Movimentation ${movimentationId} is of type "conciliacao", skipping notification creation`,
      )
      return null
    }

    const notificationScheduledDate = subWeeks(
      new Date(fullMovimentation.finalDate),
      2,
    )

    if (isBefore(notificationScheduledDate, new Date())) {
      console.log("Notification scheduled date is in the past")
      throw new Error("Notification scheduled date is in the past")
    }

    const renderer =
      fullMovimentation.type === "AUDIENCIA"
        ? this.templateService.renderAudienciaReminder
        : this.templateService.renderPericiaReminder

    const message = renderer({
      clientName: formatName(fullMovimentation.lawsuit.client.name),
      CNJ: fullMovimentation.lawsuit.cnj,
      date: fullMovimentation.finalDate,
      weeks: 2,
    })

    const notification = await this.create({
      movimentationId: fullMovimentation.id,
      clientId: fullMovimentation.lawsuit.client.id,
      message,
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
