import { IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';
import { ReportSeverity } from '../entities/report.entity';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty({ message: 'La dirección o referencia es requerida' })
  address: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es requerida' })
  description: string;

  @IsIn(['low', 'medium', 'high'], {
    message: 'La severidad debe ser: low, medium o high',
  })
  severity: ReportSeverity;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono de contacto es requerido' })
  @Matches(/^[0-9+\-\s()]{7,20}$/, {
    message: 'El teléfono de contacto no tiene un formato válido',
  })
  reporterPhone: string;
}
