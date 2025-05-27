import { readFileSync } from "node:fs"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"
import handlebars, { type TemplateDelegate } from "handlebars"
import { injectable } from "inversify"
import { z } from "zod"

import {
  type NotificationError,
  notificationErrorsSchema,
} from "@/models/Notification"

import reportTemplatePath from "@/templates/email/reportTemplate.hbs"
import audienciaTemplatePath from "@/templates/notifications/audiencia.hbs"
import periciaTemplatePath from "@/templates/notifications/pericia.hbs"
import audienciaReminderTemplatePath from "@/templates/notifications/reminder/audiencia.hbs"
import periciaReminderTemplatePath from "@/templates/notifications/reminder/pericia.hbs"

// Types and schemas

const reportTemplateParams = z.object({
  reportDate: z.date(),
  generatedDatetime: z.date(),
  processedMovimentationCount: z.number(),
  totalClients: z.number(),
  notificationsSent: z.number(),
  notificationsNotSent: z.number(),
  clients: z.array(
    z.object({
      name: z.string(),
      phoneNumber: z.string(),
      movimentations: z.array(
        z.object({
          lawsuitCNJ: z.string(),
          type: z.string(),
          date: z.date(),
          notificationSent: z.boolean(),
          notificationError: notificationErrorsSchema.optional(),
        }),
      ),
    }),
  ),
})
export type ReportTemplateParams = z.infer<typeof reportTemplateParams>

const audienciaTemplateParams = z.object({
  clientName: z.string(),
  CNJ: z.string(),
  date: z.date(),
})
export type AudienciaTemplateParams = z.infer<typeof audienciaTemplateParams>

const periciaTemplateParams = z.object({
  clientName: z.string(),
  CNJ: z.string(),
  date: z.date(),
})
export type PericiaTemplateParams = z.infer<typeof periciaTemplateParams>

const audienciaReminderTemplateParams = z.object({
  clientName: z.string(),
  CNJ: z.string(),
  date: z.date(),
  weeks: z.number(),
})
export type AudienciaReminderTemplateParams = z.infer<
  typeof audienciaReminderTemplateParams
>

const periciaReminderTemplateParams = z.object({
  clientName: z.string(),
  CNJ: z.string(),
  date: z.date(),
  weeks: z.number(),
})
export type PericiaReminderTemplateParams = z.infer<
  typeof periciaReminderTemplateParams
>

// Helpers

const notificationErrorMessages: Record<NotificationError, string> = {
  NO_PHONE_NUMBER: "Sem número de telefone",
  INVALID_PHONE: "Número inválido",
  PHONE_NOT_ON_WHATSAPP: "WhatsApp não encontrado",
  UNKNOWN_ERROR: "Erro desconhecido",
}

handlebars.registerHelper(
  "notificationErrorMessage",
  (errorCode: NotificationError | undefined) =>
    errorCode === undefined ? "-" : notificationErrorMessages[errorCode],
)
handlebars.registerHelper("formatDate", (date: Date) =>
  format(date, "dd/MM/yyyy", { locale: ptBR }),
)
handlebars.registerHelper("formatTime", (date: Date) =>
  format(date, "HH:mm", { locale: ptBR }),
)
handlebars.registerHelper("formatDateTime", (date: Date) =>
  format(date, "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
)

// service
@injectable()
export class TemplateService {
  private reportTemplate: TemplateDelegate<ReportTemplateParams>
  private audienciaTemplate: TemplateDelegate<AudienciaTemplateParams>
  private periciaTemplate: TemplateDelegate<PericiaTemplateParams>
  private audienciaReminderTemplate: TemplateDelegate<AudienciaReminderTemplateParams>
  private periciaReminderTemplate: TemplateDelegate<PericiaReminderTemplateParams>

  constructor() {
    this.reportTemplate = handlebars.compile<ReportTemplateParams>(
      readFileSync(reportTemplatePath, "utf-8"),
    )

    this.audienciaTemplate = handlebars.compile<AudienciaTemplateParams>(
      readFileSync(audienciaTemplatePath, "utf-8"),
    )

    this.periciaTemplate = handlebars.compile<PericiaTemplateParams>(
      readFileSync(periciaTemplatePath, "utf-8"),
    )

    this.audienciaReminderTemplate =
      handlebars.compile<AudienciaReminderTemplateParams>(
        readFileSync(audienciaReminderTemplatePath, "utf-8"),
      )

    this.periciaReminderTemplate =
      handlebars.compile<PericiaReminderTemplateParams>(
        readFileSync(periciaReminderTemplatePath, "utf-8"),
      )
  }

  renderReport = (params: ReportTemplateParams) => {
    return this.reportTemplate(params)
  }

  renderAudiencia = (params: AudienciaTemplateParams) => {
    return this.audienciaTemplate(params)
  }

  renderPericia = (params: PericiaTemplateParams) => {
    return this.periciaTemplate(params)
  }

  renderAudienciaReminder = (params: AudienciaReminderTemplateParams) => {
    return this.audienciaReminderTemplate(params)
  }

  renderPericiaReminder = (params: PericiaReminderTemplateParams) => {
    return this.periciaReminderTemplate(params)
  }
}
