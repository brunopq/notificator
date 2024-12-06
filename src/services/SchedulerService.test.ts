import SchedulerService from "./SchedulerService"

describe("SchedulerService", () => {
  it("should schedule a notification", async () => {
    const notificationId = "123"
    const timestamp = new Date("2025-01-01T00:00:00Z")

    const schedule = await SchedulerService.scheduleNotificationSending(
      timestamp,
      notificationId,
    )

    expect(schedule).toHaveProperty("success")
  })
})
