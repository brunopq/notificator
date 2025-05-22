import { endOfDay, startOfDay } from "date-fns"

import type { EmailService } from "@/services/EmailService"
import type { ExecutionService } from "@/services/ExecutionService"
import type {
  ReportTemplateParams,
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
    private readonly db: typeof database,
    private emailService: EmailService,
    private templateService: TemplateService,
    private executionService: ExecutionService,
  ) {}

  async execute(date = new Date("2025-05-13 12:32:35")) {
    // encontrar as execuções da data -> pegar movimentações -> processos -> clientes
    const shit = await this.db
      .selectDistinct({
        clientName: client.name,
        clientPhones: client.phones,
        movimentation: {
          movimentationId: movimentation.id,
          lawsuitCNJ: lawsuit.cnj,
          type: movimentation.type,
          date: movimentation.finalDate,
          notificationId: notification.id,
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
      .orderBy(client.name) // remove this later

    console.log(shit)
    console.log(`Found ${shit.length} shits`)

    const clientMap = new Map<string, ReportTemplateParams["clients"][number]>()

    for (const item of shit) {
      const key = item.clientName
      if (key === null) continue

      const clientEntry = clientMap.get(key)

      const movimentation = {
        date: item.movimentation.date,
        lawsuitCNJ: item.movimentation.lawsuitCNJ,
        notificationSent: item.movimentation.notificationStatus === "SENT",
        type: item.movimentation.type,
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
    console.dir(grouped, { depth: null })

    const content = this.templateService.renderReport({
      clients: grouped,
      generatedDatetime: new Date(),
      processedMovimentationCount: 123,
      reportDate: date,
      totalClients: 123,
      totalErrorClients: 123,
      totalSuccessfullClients: 123,
    })

    await this.emailService.sendEmail({
      to: "iboti@ibotiadvogados.com.br",
      subject: "Relatório de notificações",
      content,
    })
  }
}
