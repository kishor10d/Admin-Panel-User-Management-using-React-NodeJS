import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760000000000 implements MigrationInterface {
  name = 'InitialSchema1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE roles (id char(36) NOT NULL, name varchar(50) NOT NULL, description varchar(255) NULL, isActive tinyint NOT NULL DEFAULT 1, created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), deleted_at datetime(6) NULL, UNIQUE INDEX IDX_roles_name (name), PRIMARY KEY (id)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE permissions (id char(36) NOT NULL, \`key\` varchar(100) NOT NULL, description varchar(255) NULL, created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), deleted_at datetime(6) NULL, UNIQUE INDEX IDX_permissions_key (\`key\`), PRIMARY KEY (id)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE users (id char(36) NOT NULL, email varchar(254) NOT NULL, password_hash varchar(255) NOT NULL, name varchar(128) NULL, mobile varchar(20) NULL, is_active tinyint NOT NULL DEFAULT 1, must_change_password tinyint NOT NULL DEFAULT 0, created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), deleted_at datetime(6) NULL, UNIQUE INDEX IDX_users_email (email), PRIMARY KEY (id)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE role_permissions (id char(36) NOT NULL, role_id char(36) NOT NULL, permission_id char(36) NOT NULL, UNIQUE INDEX IDX_role_permissions_role_permission (role_id, permission_id), PRIMARY KEY (id), CONSTRAINT FK_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE, CONSTRAINT FK_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE user_roles (id char(36) NOT NULL, user_id char(36) NOT NULL, role_id char(36) NOT NULL, UNIQUE INDEX IDX_user_roles_user_role (user_id, role_id), PRIMARY KEY (id), CONSTRAINT FK_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT FK_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE password_reset_tokens (id char(36) NOT NULL, user_id char(36) NOT NULL, token_hash varchar(255) NOT NULL, expires_at datetime NOT NULL, used_at datetime NULL, created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), deleted_at datetime(6) NULL, UNIQUE INDEX IDX_password_reset_tokens_token_hash (token_hash), PRIMARY KEY (id), CONSTRAINT FK_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE login_events (id char(36) NOT NULL, user_id char(36) NULL, email varchar(254) NOT NULL, ip_address varchar(45) NULL, user_agent varchar(512) NULL, successful tinyint NOT NULL DEFAULT 0, created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), deleted_at datetime(6) NULL, INDEX IDX_login_events_user_id (user_id), PRIMARY KEY (id), CONSTRAINT FK_login_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE login_events');
    await queryRunner.query('DROP TABLE password_reset_tokens');
    await queryRunner.query('DROP TABLE user_roles');
    await queryRunner.query('DROP TABLE role_permissions');
    await queryRunner.query('DROP TABLE users');
    await queryRunner.query('DROP TABLE permissions');
    await queryRunner.query('DROP TABLE roles');
  }
}
