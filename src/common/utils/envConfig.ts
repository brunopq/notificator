import dotenv from "dotenv"
import { cleanEnv, host, num, port, str, testOnly } from "envalid"

dotenv.config()

export const env = cleanEnv(process.env, {
  // general
  NODE_ENV: str({
    devDefault: testOnly("test"),
    choices: ["development", "production", "test"],
  }),
  HOST: host({ devDefault: testOnly("localhost") }),
  PORT: port({ devDefault: testOnly(3000) }),
  CORS_ORIGIN: str(),
  // whatsapp
  WHATSAPP_SERVICE_URL: str(),
  WHATSAPP_INSTANCE_ID: str(),
  WHATSAPP_INSTANCE_TOKEN: str(),
  // db
  DB_HOST: str(),
  DB_PORT: num(),
  DB_USER: str(),
  DB_PASS: str(),
  DB_NAME: str(),
  // judice
  JUDICE_TENANT: str(),
  JUDICE_USER: str(),
  JUDICE_PASS: str(),
  // aws scheduler
  SCHEDULER_TARGET_ARN: str(),
  SCHEDULER_ROLE_ARN: str(),
})
