import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"

import { env } from "@/common/utils/envConfig"

type SendEmailConfig = {
  to: string
  cc?: string[]
  subject: string
  content: string
}

export class EmailService {
  private sesClient: SESClient
  constructor() {
    this.sesClient = new SESClient({
      region: "sa-east-1",
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    })
  }

  async sendEmail(config: SendEmailConfig) {
    const sendEmailCommand = new SendEmailCommand({
      Source: "registro@ibotiadvogados.com.br",
      Destination: {
        ToAddresses: [config.to],
        CcAddresses: config.cc,
      },
      Message: {
        Subject: {
          Data: config.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: config.content,
            Charset: "UTF-8",
          },
        },
      },
    })

    try {
      const response = await this.sesClient.send(sendEmailCommand)

      return response.MessageId
    } catch (e) {
      console.log("Something went wrong when sending email")
      console.log(e)
    }
  }
}
