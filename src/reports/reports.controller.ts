import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB

// Solo se aceptan imágenes en el campo "photo"
const photoInterceptor = FileInterceptor('photo', {
  limits: { fileSize: MAX_PHOTO_SIZE },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(
        new BadRequestException('El archivo "photo" debe ser una imagen (jpg, png, webp...)'),
        false,
      );
    }
    callback(null, true);
  },
});

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(photoInterceptor)
  create(@Body() dto: CreateReportDto, @UploadedFile() photo: Express.Multer.File) {
    if (!photo) {
      throw new BadRequestException('La foto de la fuga es obligatoria (campo "photo")');
    }
    return this.reportsService.create(dto, photo);
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  // Extra: la cuadrilla sube la foto de la reparación y el reporte queda resuelto
  @Patch(':id/repair')
  @UseInterceptors(photoInterceptor)
  repair(@Param('id', ParseIntPipe) id: number, @UploadedFile() photo: Express.Multer.File) {
    if (!photo) {
      throw new BadRequestException('La foto de la reparación es obligatoria (campo "photo")');
    }
    return this.reportsService.repair(id, photo);
  }
}
