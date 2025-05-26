import {
  CreateScheduleCommand,
  SchedulerClient,
} from "@aws-sdk/client-scheduler"
import { format } from "date-fns"
import { injectable } from "inversify"

import { env } from "@/common/utils/envConfig"

@injectable()
export class SchedulerService {
  async scheduleNotificationSending(timestamp: Date, notificationId: string) {
    const schedulerClient = new SchedulerClient({
      region: "sa-east-1",
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
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

      if (!response.ScheduleArn) {
        throw new Error("No ScheduleArn returned")
      }

      return {
        success: true as const,
        scheduleArn: response.ScheduleArn,
      }
    } catch (error) {
      console.error(`Error scheduling notification ${notificationId}:`)
      console.error(error)
      return {
        success: false as const,
      }
    }
  }
}
