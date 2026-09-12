import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { envs } from './config/envs';
import { EmailModule } from './email/email.module';
import { Report } from './reports/entities/report.entity';
import { ReportsModule } from './reports/reports.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.DB_HOST,
      port: envs.DB_PORT,
      username: envs.DB_USERNAME,
      password: envs.DB_PASSWORD,
      database: envs.DB_NAME,
      entities: [Report, User],
      synchronize: false, // Las tablas se gestionan solo con migraciones
      autoLoadEntities: true,
    }),
    EmailModule,
    ReportsModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
