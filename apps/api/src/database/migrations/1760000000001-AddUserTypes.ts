import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTypes1760000000001 implements MigrationInterface {
  name = 'AddUserTypes1760000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE users ADD user_type varchar(32) NOT NULL DEFAULT 'REGULAR' AFTER mobile");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE users DROP COLUMN user_type');
  }
}
