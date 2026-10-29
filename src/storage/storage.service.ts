import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { envs } from '../config/envs';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: envs.AWS_REGION,
      credentials: {
        accessKeyId: envs.AWS_ACCESS_KEY_ID,
        secretAccessKey: envs.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Sube un archivo al bucket de S3 dentro de la carpeta indicada
   * (por ejemplo "reports/") y regresa la URL pública del objeto.
   */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const extension = extname(file.originalname).toLowerCase();
    const key = `${cleanFolder}/${Date.now()}-${randomUUID()}${extension}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: envs.AWS_BUCKET_NAME,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (error) {
      this.logger.error(`No se pudo subir el archivo ${key} a S3`, error);
      throw new InternalServerErrorException('No se pudo subir la foto al almacenamiento');
    }

    const url = `https://${envs.AWS_BUCKET_NAME}.s3.${envs.AWS_REGION}.amazonaws.com/${key}`;
    this.logger.log(`Archivo subido a S3: ${url}`);
    return url;
  }
}
