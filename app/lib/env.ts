// Checks whether all required environment variables are set before starting the application
import { z } from "zod";
import tryParseEnv from "./try-parse-env";

const EnvSchema = z.object({
  NODE_ENV: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  DATABASE_URL: z.string(),
  BANKING_CLIENT_ID: z.string(),
  BANKING_CLIENT_SECRET: z.string(),
  BANKING_EIDASPRIVATEKEY: z.string(),
  BANKING_AGREEMENT_ID: z.string(),
  SFTP_URL: z.string(),
  SFTP_USERNAME: z.string(),
  SFTP_PASSWORD: z.string(),
  SFTP_SEND_DIR: z.string(),
  SFTP_RECEIVE_DIR: z.string(),
});

export type EnvSchema = z.infer<typeof EnvSchema>;

tryParseEnv(EnvSchema);

export default EnvSchema.parse(process.env);