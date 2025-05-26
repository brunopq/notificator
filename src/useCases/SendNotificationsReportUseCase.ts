import { endOfDay, startOfDay } from "date-fns"
import { inject } from "inversify"

import { EmailService } from "@/services/EmailService"
import {
  type ReportTemplateParams,
  TemplateService,
} from "@/services/TemplateService"

import type { db as database } from "@/database"
import {
  client,
  execution,
  lawsuit,
  movimentation,
  notification,
  notificationSnapshot,
} from "@/database/schema"
import { and, between, eq, not } from "drizzle-orm"

export class SendNotificationsReportUseCase {
  constructor(
    @inject("database") private readonly db: typeof database,
    @inject(EmailService) private emailService: EmailService,
    @inject(TemplateService) private templateService: TemplateService,
  ) {}

  async execute(date: Date) {
    const rawData = await this.db
      .selectDistinct({
        clientName: client.name,
        clientPhones: client.phones,
        movimentation: {
          lawsuitCNJ: lawsuit.cnj,
          type: movimentation.type,
          date: movimentation.finalDate,
          notificationStatus: notificationSnapshot.status,
          notificationError: notificationSnapshot.error,
        },
      })
      .from(execution)
      .innerJoin(
        notificationSnapshot,
        eq(execution.id, notificationSnapshot.executionId),
      )
      .leftJoin(
        notification,
        eq(notificationSnapshot.notificationId, notification.id),
      )
      .innerJoin(
        movimentation,
        eq(notification.movimentationId, movimentation.id),
      )
      .innerJoin(lawsuit, eq(movimentation.lawsuitId, lawsuit.id))
      .innerJoin(client, eq(client.id, lawsuit.clientId))
      .where(
        and(
          between(execution.createdAt, startOfDay(date), endOfDay(date)),
          not(eq(notificationSnapshot.status, "SCHEDULED")),
        ),
      )
      .orderBy(notificationSnapshot.status)

    const clientMap = new Map<string, ReportTemplateParams["clients"][number]>()

    for (const item of rawData) {
      const key = item.clientName
      if (key === null) continue

      const clientEntry = clientMap.get(key)

      const movimentation = {
        ...item.movimentation,
        notificationSent: item.movimentation.notificationStatus === "SENT",
        notificationError: item.movimentation.notificationError || undefined,
      }

      if (!clientEntry) {
        clientMap.set(key, {
          name: item.clientName,
          phoneNumber: item.clientPhones[0],
          movimentations: item.movimentation ? [movimentation] : [],
        })
      } else {
        clientEntry.movimentations.push(movimentation)
      }
    }

    const grouped = Array.from(clientMap.values())

    // TODO: do this in sql to make it fast as fuck
    const notificationsSent = grouped.reduce(
      (acc, c) =>
        acc +
        c.movimentations.reduce(
          (acc, m) => acc + (m.notificationSent ? 1 : 0),
          0,
        ),
      0,
    )
    const notificationsNotSent = grouped.reduce(
      (acc, c) =>
        acc +
        c.movimentations.reduce(
          (acc, m) => acc + (m.notificationSent ? 0 : 1),
          0,
        ),
      0,
    )

    const content = this.templateService.renderReport({
      clients: grouped,
      generatedDatetime: new Date(),
      processedMovimentationCount: rawData.length,
      reportDate: date,
      totalClients: grouped.length,
      notificationsSent,
      notificationsNotSent,
    })

    await this.emailService.sendEmail({
      to: "iboti@ibotiadvogados.com.br",
      subject: "Relatório de notificações",
      cc: [
        "ana@ibotiadvogados.com.br",
        "anderson@ibotiadvogados.com.br",
        "adriano@ibotiadvogados.com.br",
        "bruno@ibotiadvogados.com.br",
        "rafaelvieira@ibotiadvogados.com.br",
      ],
      content,
    })
  }
}
