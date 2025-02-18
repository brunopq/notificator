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

    const totalSent = 0
    const totalNotifications = 0

    // TODO: improve this type
    const lawsuitNotifications: Record<
      string,
      Awaited<ReturnType<NotifyByLawsuitCNJ["execute"]>>
    > = {}

    for (const assignment of agendaAssignments) {
      console.log(`Assignment for lawsuit ${assignment.lawsuitCNJ}`)
      try {
        const movimentationsResult = await this.notifyByLawsuitCNJ.execute(
          assignment.lawsuitCNJ,
        )

        console.dir(movimentationsResult, { depth: null })
        lawsuitNotifications[assignment.lawsuitCNJ] = movimentationsResult

        const {
          s: notificationsSent,
          e: notificationsError,
          t: totalNotifications,
        } = movimentationsResult.reduce(
          (acc, { notifications }) => ({
            s: acc.s + notifications.sent,
            e: acc.e + notifications.error,
            t: acc.t + notifications.total,
          }),
          { s: 0, e: 0, t: 0 },
        )

        // all movimentations were in the past
        if (totalNotifications === 0) {
          console.log(
            `All movimentations for lawsuit ${assignment.lawsuitCNJ} already happened`,
          )
          await this.judiceService.completeAssignment(
            assignment.assignmentJudiceId,
            assignment.lawsuitJudiceId,
          )
          continue
        }

        // at least one notification has been sent and no errors hapened
        if (notificationsError === 0 && notificationsSent >= 1) {
          console.log(
            `Completing assignment for lawsuit ${assignment.lawsuitCNJ}`,
          )
          // await this.judiceService.completeAssignment(
          //   assignment.assignmentJudiceId,
          //   assignment.lawsuitJudiceId,
          // )
        }

        if (notificationsError >= 1) {
          console.log(
            `Error in assignment for lawsuit ${assignment.lawsuitCNJ}`,
          )
        }
      } catch (e) {
        console.log(`Assignment for lawsuit ${assignment.lawsuitCNJ} blew up`)
        console.error(e)
      }
      console.log(`Finished assignmet for lawsuit ${assignment.lawsuitCNJ}`)
    }
  }
}
