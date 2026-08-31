import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { UserType } from '../../common/user-type';
import { BaseEntity } from './base.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 50 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ default: true })
  isActive!: boolean;
}

@Entity('permissions')
export class Permission extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 100 })
  key!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;
}

@Entity('role_permissions')
@Index(['roleId', 'permissionId'], { unique: true })
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'role_id', type: 'char', length: 36 })
  roleId!: string;

  @Column({ name: 'permission_id', type: 'char', length: 36 })
  permissionId!: string;
}

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 254 })
  email!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile!: string | null;

  @Column({ name: 'user_type', type: 'varchar', length: 32, default: 'REGULAR' })
  userType!: UserType;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'must_change_password', default: false })
  mustChangePassword!: boolean;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: 'locked_until', type: 'datetime', nullable: true })
  lockedUntil!: Date | null;
}

@Entity('user_roles')
@Index(['userId', 'roleId'], { unique: true })
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId!: string;

  @Column({ name: 'role_id', type: 'char', length: 36 })
  roleId!: string;
}

@Entity('password_reset_tokens')
export class PasswordResetToken extends BaseEntity {
  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId!: string;

  @Index({ unique: true })
  @Column({ name: 'token_hash', length: 255 })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'datetime', nullable: true })
  usedAt!: Date | null;
}

@Entity('auth_sessions')
export class AuthSession extends BaseEntity {
  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId!: string;

  @Index({ unique: true })
  @Column({ name: 'refresh_token_hash', length: 255 })
  refreshTokenHash!: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'datetime', nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;
}

@Entity('login_events')
export class LoginEvent extends BaseEntity {
  @Column({ name: 'user_id', type: 'char', length: 36, nullable: true })
  userId!: string | null;

  @Column({ length: 254 })
  email!: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ default: false })
  successful!: boolean;
}

export const entities = [Role, Permission, RolePermission, User, UserRole, PasswordResetToken, AuthSession, LoginEvent];
