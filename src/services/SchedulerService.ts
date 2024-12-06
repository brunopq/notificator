import {
  CreateScheduleCommand,
  SchedulerClient,
} from "@aws-sdk/client-scheduler"
import { format } from "date-fns"

import { env } from "@/common/utils/envConfig"

class SchedulerService {
  async scheduleNotificationSending(timestamp: Date, notificationId: string) {
    const schedulerClient = new SchedulerClient({
      region: "sa-east-1",
    })

    const scheduleCommand = new CreateScheduleCommand({
      Name: `Notification_${notificationId}`,
      Description: `Notification ${notificationId} scheduled at ${timestamp.toLocaleString()}`,
      ScheduleExpression: `at(${format(timestamp, "yyyy-MM-dd")}T${format(timestamp, "hh:mm:ss")})`,
      ScheduleExpressionTimezone: "America/Sao_Paulo",
      ActionAfterCompletion: "DELETE",
      FlexibleTimeWindow: { Mode: "OFF" },

      Target: {
        Arn: env.SCHEDULER_TARGET_ARN,
        RoleArn: env.SCHEDULER_ROLE_ARN,

        Input: JSON.stringify({ notification_id: notificationId }),
      },
    })
    try {
      const response = await schedulerClient.send(scheduleCommand)
      return {
        success: true,
        scheduleArn: response.ScheduleArn,
      }
    } catch (error) {
      console.error(`Error scheduling notification ${notificationId}:`)
      console.error(error)
      return {
        success: false,
      }
    }
  }
}

export default new SchedulerService()
