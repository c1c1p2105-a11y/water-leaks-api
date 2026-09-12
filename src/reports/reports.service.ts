import { Injectable, Logger } from '@nestjs/common';
import { envs } from '../config/envs';
import { EmailService } from '../email/email.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Report } from './entities/report.entity';
import { ReportsRepository } from './reports.repository';
import { generateReportTemplate } from './templates/report.template';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateReportDto): Promise<Report> {
    const report = this.reportsRepository.create({
      address: dto.address,
      description: dto.description,
      severity: dto.severity,
      reporterPhone: dto.reporterPhone,
    });

    const savedReport = await this.reportsRepository.save(report);

    try {
      const html = generateReportTemplate(savedReport);
      await this.emailService.sendEmail(
        envs.MAINTENANCE_CREW_EMAIL,
        `Nuevo reporte de fuga de agua - ${savedReport.address}`,
        html,
      );
    } catch (error) {
      // El reporte ya quedó guardado; solo dejamos constancia del fallo de envío
      // para no perder el registro en la base de datos por un problema del correo.
      this.logger.error(
        `El reporte #${savedReport.id} se guardó, pero falló el envío del correo a la cuadrilla`,
        error,
      );
    }

    return savedReport;
  }

  findAll(): Promise<Report[]> {
    return this.reportsRepository.findAll();
  }
}
