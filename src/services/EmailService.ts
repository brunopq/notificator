import { readFileSync } from "node:fs"
import path from "node:path"
import handlebars from "handlebars"
import { z } from "zod"

const reportTemplateParams = z.object({
  reportDay: z.date(),
  generatedDatetime: z.date(),
  processedMovimentationCount: z.number(),
  items: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    }),
  ),
})
type ReportTemplateParams = z.infer<typeof reportTemplateParams>

export class EmailService {
  private reportTemplate: string

  constructor() {
    const emailTemplatesPath = path.resolve(
      __dirname,
      "..",
      "templates",
      "email",
    )
    const reportTemplatePath = path.resolve(
      emailTemplatesPath,
      "reportTemplate.hbs",
    )
    this.reportTemplate = readFileSync(reportTemplatePath, "utf-8")
  }

  renderReport(params: ReportTemplateParams) {
    const template = handlebars.compile<ReportTemplateParams>(
      this.reportTemplate,
    )

    return template(params)
  }
}
