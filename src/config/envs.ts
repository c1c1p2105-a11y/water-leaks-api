import 'dotenv/config';
import * as env from 'env-var';

export const envs = {
  PORT: env.get('PORT').default(3000).asPortNumber(),

  DB_HOST: env.get('DB_HOST').required().asString(),
  DB_PORT: env.get('DB_PORT').required().asPortNumber(),
  DB_USERNAME: env.get('DB_USERNAME').required().asString(),
  DB_PASSWORD: env.get('DB_PASSWORD').required().asString(),
  DB_NAME: env.get('DB_NAME').required().asString(),

  MAIL_HOST: env.get('MAIL_HOST').required().asString(),
  MAIL_PORT: env.get('MAIL_PORT').required().asPortNumber(),
  MAIL_USER: env.get('MAIL_USER').required().asString(),
  MAIL_PASSWORD: env.get('MAIL_PASSWORD').required().asString(),
  MAIL_FROM: env.get('MAIL_FROM').required().asString(),

  MAINTENANCE_CREW_EMAIL: env.get('MAINTENANCE_CREW_EMAIL').required().asString(),

  // AWS S3 (fotos de las fugas)
  AWS_REGION: env.get('AWS_REGION').required().asString(),
  AWS_ACCESS_KEY_ID: env.get('AWS_ACCESS_KEY_ID').required().asString(),
  AWS_SECRET_ACCESS_KEY: env.get('AWS_SECRET_ACCESS_KEY').required().asString(),
  AWS_BUCKET_NAME: env.get('AWS_BUCKET_NAME').required().asString(),
};
