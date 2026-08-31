import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountLocking1760000000002 implements MigrationInterface {
  name = 'AddAccountLocking1760000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE users ADD failed_login_attempts int NOT NULL DEFAULT 0 AFTER must_change_password');
    await queryRunner.query('ALTER TABLE users ADD locked_until datetime NULL AFTER failed_login_attempts');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE users DROP COLUMN locked_until');
    await queryRunner.query('ALTER TABLE users DROP COLUMN failed_login_attempts');
  }
}
