import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { envs } from '../config/envs';
import { EmailService } from '../email/email.service';
import { StorageService } from '../storage/storage.service';
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
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateReportDto, photo: Express.Multer.File): Promise<Report> {
    if (!photo) {
      throw new BadRequestException('La foto de la fuga es obligatoria (campo "photo")');
    }

    // 1. Subir la foto a la carpeta "reports/" del bucket
    const photoUrl = await this.storageService.uploadFile(photo, 'reports/');

    // 2. Guardar el reporte con la URL de la foto
    const report = this.reportsRepository.create({
      address: dto.address,
      description: dto.description,
      severity: dto.severity,
      reporterPhone: dto.reporterPhone,
      photoUrl,
    });
    const savedReport = await this.reportsRepository.save(report);

    // 3. Avisar a la cuadrilla con la foto dentro del correo
    try {
      const html = generateReportTemplate(dto, photoUrl);
      await this.emailService.sendEmail(
        envs.MAINTENANCE_CREW_EMAIL,
        `Nuevo reporte de fuga de agua - ${savedReport.address}`,
        html,
      );
    } catch (error) {
      // El reporte ya quedó guardado; solo dejamos constancia del fallo de envío
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

  async repair(id: number, photo: Express.Multer.File): Promise<Report> {
    const report = await this.reportsRepository.findOneById(id);
    if (!report) {
      throw new NotFoundException(`No existe el reporte #${id}`);
    }

    report.repairPhotoUrl = await this.storageService.uploadFile(photo, 'repairs/');
    report.isResolved = true;
    return this.reportsRepository.save(report);
  }
}
