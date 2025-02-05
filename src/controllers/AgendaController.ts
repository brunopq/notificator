import type { RequestHandler } from "express"

import type { JudiceService } from "@/services/JudiceService"
import type { NotifyByLawsuitCNJ } from "@/useCases/NotifyByLawsuitCNJ"

export class AgendaController {
  constructor(
    private readonly judiceService: JudiceService,
    private readonly notifyByLawsuitCNJ: NotifyByLawsuitCNJ,
  ) {}

  // TODO: move to an use case or service
  handleNotificationTasks: RequestHandler = async (_req, res) => {
    const agendaAssignments = await this.judiceService.getAssignments()

    res.json({ assignmentsFound: agendaAssignments.length })

    console.log(`${agendaAssignments.length} assignments found`)

    let totalSent = 0
    let totalNotifications = 0

    // TODO: improve this type
    const lawsuitNotifications: Record<
      string,
      Awaited<ReturnType<NotifyByLawsuitCNJ["execute"]>>
    > = {}

    for (const assignment of agendaAssignments) {
      try {
        const result = await this.notifyByLawsuitCNJ.execute(
          assignment.lawsuitCNJ,
        )

        totalSent += result.sent
        totalNotifications += result.total

        lawsuitNotifications[assignment.lawsuitCNJ] = result

        if (!result.errorSending) {
          await this.judiceService.completeAssignment(
            assignment.assignmentJudiceId,
            assignment.lawsuitJudiceId,
          )
        }
      } catch (e) {
        console.error(e)
      }
    }
  }
}
