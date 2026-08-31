import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthSessions1760000000003 implements MigrationInterface {
  name = 'AddAuthSessions1760000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE auth_sessions (id char(36) NOT NULL, user_id char(36) NOT NULL, refresh_token_hash varchar(255) NOT NULL, expires_at datetime NOT NULL, revoked_at datetime NULL, ip_address varchar(45) NULL, user_agent varchar(512) NULL, created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), deleted_at datetime(6) NULL, UNIQUE INDEX IDX_auth_sessions_refresh_token_hash (refresh_token_hash), INDEX IDX_auth_sessions_user_id (user_id), PRIMARY KEY (id), CONSTRAINT FK_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE auth_sessions');
  }
}
