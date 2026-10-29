import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhotoUrlToReport1761700000000 implements MigrationInterface {
  name = 'AddPhotoUrlToReport1761700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // nullable para no romper los reportes que ya existían antes de pedir foto
    await queryRunner.addColumns('WATER_REPORT', [
      new TableColumn({ name: 'photo_url', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'repair_photo_url', type: 'varchar', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('WATER_REPORT', 'repair_photo_url');
    await queryRunner.dropColumn('WATER_REPORT', 'photo_url');
  }
}
