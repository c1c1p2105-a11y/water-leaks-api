import { Report } from '../entities/report.entity';

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: '#2e7d32',
  medium: '#f9a825',
  high: '#c62828',
};

/**
 * Genera el HTML del correo de aviso enviado a la cuadrilla de mantenimiento
 * cuando un ciudadano crea un nuevo reporte de fuga de agua.
 */
export function generateReportTemplate(dto: Report): string {
  const severityLabel = SEVERITY_LABELS[dto.severity] ?? dto.severity;
  const severityColor = SEVERITY_COLORS[dto.severity] ?? '#455a64';

  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Nuevo reporte de fuga de agua</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, Helvetica, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <tr>
                <td style="background-color:#0d47a1; padding:20px 24px;">
                  <h1 style="color:#ffffff; font-size:20px; margin:0;">
                    💧 Nuevo reporte de fuga de agua
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <p style="font-size:14px; color:#333333; margin-top:0;">
                    Se ha registrado un nuevo reporte ciudadano de fuga de agua en la vía pública.
                    A continuación los detalles:
                  </p>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top:16px;">
                    <tr>
                      <td style="padding:10px 12px; background-color:#f0f2f5; font-size:13px; font-weight:bold; color:#555555; width:35%; border:1px solid #e0e0e0;">
                        Dirección / Referencia
                      </td>
                      <td style="padding:10px 12px; font-size:13px; color:#222222; border:1px solid #e0e0e0;">
                        ${dto.address}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 12px; background-color:#f0f2f5; font-size:13px; font-weight:bold; color:#555555; border:1px solid #e0e0e0;">
                        Descripción
                      </td>
                      <td style="padding:10px 12px; font-size:13px; color:#222222; border:1px solid #e0e0e0;">
                        ${dto.description}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 12px; background-color:#f0f2f5; font-size:13px; font-weight:bold; color:#555555; border:1px solid #e0e0e0;">
                        Severidad
                      </td>
                      <td style="padding:10px 12px; font-size:13px; border:1px solid #e0e0e0;">
                        <span style="display:inline-block; padding:4px 10px; border-radius:12px; background-color:${severityColor}; color:#ffffff; font-size:12px; font-weight:bold;">
                          ${severityLabel}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 12px; background-color:#f0f2f5; font-size:13px; font-weight:bold; color:#555555; border:1px solid #e0e0e0;">
                        Teléfono de contacto
                      </td>
                      <td style="padding:10px 12px; font-size:13px; color:#222222; border:1px solid #e0e0e0;">
                        ${dto.reporterPhone}
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:12px; color:#888888; margin-top:24px;">
                    Por favor coordinar la atención correspondiente con la cuadrilla de mantenimiento a la brevedad.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f0f2f5; padding:16px 24px; text-align:center;">
                  <p style="font-size:11px; color:#999999; margin:0;">
                    Este es un correo automático generado por el sistema municipal de reportes de fugas de agua.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
