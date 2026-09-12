import { DataSource } from 'typeorm';
import { envs } from '../config/envs';
import { Report } from '../reports/entities/report.entity';
import { User } from '../users/entities/user.entity';

// DataSource usado exclusivamente por el CLI de TypeORM para generar
// y ejecutar migraciones (npm run migration:*). La app en runtime usa
// la configuración definida en app.module.ts.
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: envs.DB_HOST,
  port: envs.DB_PORT,
  username: envs.DB_USERNAME,
  password: envs.DB_PASSWORD,
  database: envs.DB_NAME,
  entities: [Report, User],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
});
