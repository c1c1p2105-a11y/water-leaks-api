import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsRepository {
  constructor(
    @InjectRepository(Report)
    private readonly repository: Repository<Report>,
  ) {}

  create(data: Partial<Report>): Report {
    return this.repository.create(data);
  }

  save(report: Report): Promise<Report> {
    return this.repository.save(report);
  }

  findAll(): Promise<Report[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  findOneById(id: number): Promise<Report | null> {
    return this.repository.findOne({ where: { id } });
  }
}
