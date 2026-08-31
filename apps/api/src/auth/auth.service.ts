import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { In, IsNull, Repository } from 'typeorm';
import { AuthSession, LoginEvent, PasswordResetToken, Permission, Role, RolePermission, User, UserRole } from '../database/entities';
import type { AuthUser, JwtPayload } from './auth-user.type';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(Permission) private readonly permissions: Repository<Permission>,
    @InjectRepository(UserRole) private readonly userRoles: Repository<UserRole>,
    @InjectRepository(RolePermission) private readonly rolePermissions: Repository<RolePermission>,
    @InjectRepository(LoginEvent) private readonly loginEvents: Repository<LoginEvent>,
    @InjectRepository(PasswordResetToken) private readonly resetTokens: Repository<PasswordResetToken>,
    @InjectRepository(AuthSession) private readonly sessions: Repository<AuthSession>,
    private readonly mailService: MailService,
  ) {}

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email: normalizedEmail } });
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

    const isLocked = Boolean(user?.lockedUntil && user.lockedUntil > new Date());
    if (!user || !user.isActive || isLocked || !passwordMatches) {
      if (user && user.isActive && !isLocked && !passwordMatches) await this.recordFailedLogin(user);
      await this.recordLogin(user?.id ?? null, normalizedEmail, false, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.failedLoginAttempts || user.lockedUntil) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await this.users.save(user);
    }
    await this.recordLogin(user.id, user.email, true, ipAddress, userAgent);
    const currentUser = await this.getCurrentUser(user.id);
    const session = await this.createSession(user.id, ipAddress, userAgent);
    return { accessToken: await this.createAccessToken(currentUser, session.id), refreshToken: session.refreshToken, user: currentUser };
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) throw new UnauthorizedException();

    const userRoles = await this.userRoles.find({ where: { userId } });
    const roleIds = userRoles.map((item) => item.roleId);
    const roles = roleIds.length ? await this.roles.findBy({ id: In(roleIds), isActive: true }) : [];
    const activeRoleIds = roles.map((role) => role.id);
    const links = activeRoleIds.length ? await this.rolePermissions.find({ where: { roleId: In(activeRoleIds) } }) : [];
    const permissionIds = [...new Set(links.map((item) => item.permissionId))];
    const permissions = permissionIds.length ? await this.permissions.findBy({ id: In(permissionIds) }) : [];

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      mobile: user.mobile,
      userType: user.userType,
      mustChangePassword: user.mustChangePassword,
      roles: roles.map((role) => role.name),
      permissions: permissions.map((permission) => permission.key),
    };
  }

  async verifyAccessToken(token: string): Promise<{ user: AuthUser; sessionId: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const session = await this.sessions.findOne({ where: { id: payload.sid, userId: payload.sub, revokedAt: IsNull() } });
      if (!session || session.expiresAt <= new Date()) throw new UnauthorizedException();
      return { user: await this.getCurrentUser(payload.sub), sessionId: session.id };
    } catch {
      throw new UnauthorizedException();
    }
  }

  async changePassword(userId: string, sessionId: string, currentPassword: string, newPassword: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) throw new UnauthorizedException('Current password is incorrect.');
    if (await bcrypt.compare(newPassword, user.passwordHash)) throw new BadRequestException('New password must be different from your current password.');
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await this.users.save(user);
    await this.revokeUserSessions(user.id, sessionId);
    await this.invalidatePasswordResetTokens(user.id);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<AuthUser> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.users.findOne({ where: { email } });
      if (existing && existing.id !== user.id) throw new ConflictException('A user with this email already exists.');
      user.email = email;
    }
    if (dto.name !== undefined) user.name = dto.name.trim() || null;
    if (dto.mobile !== undefined) user.mobile = dto.mobile.trim() || null;

    await this.users.save(user);
    return this.getCurrentUser(user.id);
  }

  async requestPasswordReset(email: string) {
    const user = await this.users.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.isActive) return;

    await this.resetTokens.update({ userId: user.id, usedAt: IsNull() }, { usedAt: new Date() });
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const resetToken = await this.resetTokens.save(this.resetTokens.create({ userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000), usedAt: null }));

    const resetUrl = new URL('/reset-password', this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:5180');
    resetUrl.searchParams.set('token', token);
    try {
      await this.mailService.sendPasswordReset({ to: user.email, name: user.name, resetUrl: resetUrl.toString() });
    } catch (error) {
      resetToken.usedAt = new Date();
      await this.resetTokens.save(resetToken);
      this.logger.error(`Password-reset email could not be delivered for user ${user.id}.`, error instanceof Error ? error.stack : undefined);
    }
  }

  async resetPassword(token: string, password: string) {
    const resetToken = await this.resetTokens.findOne({ where: { tokenHash: this.hashToken(token) } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) throw new BadRequestException('This password-reset link is invalid or expired.');
    const user = await this.users.findOne({ where: { id: resetToken.userId } });
    if (!user || !user.isActive) throw new BadRequestException('This password-reset link is invalid or expired.');
    const claim = await this.resetTokens.update({ id: resetToken.id, usedAt: IsNull() }, { usedAt: new Date() });
    if (claim.affected !== 1) throw new BadRequestException('This password-reset link is invalid or expired.');
    user.passwordHash = await bcrypt.hash(password, 12);
    user.mustChangePassword = false;
    await this.users.save(user);
    await this.revokeUserSessions(user.id);
    await this.invalidatePasswordResetTokens(user.id);
  }

  async refresh(refreshToken: string | undefined, ipAddress?: string, userAgent?: string) {
    if (!refreshToken) throw new UnauthorizedException();
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.sessions.findOne({ where: { refreshTokenHash: tokenHash, revokedAt: IsNull() } });
    if (!session || session.expiresAt <= new Date()) throw new UnauthorizedException();
    const revoke = await this.sessions.update({ id: session.id, revokedAt: IsNull() }, { revokedAt: new Date() });
    if (revoke.affected !== 1) throw new UnauthorizedException();
    const user = await this.getCurrentUser(session.userId);
    const replacement = await this.createSession(user.id, ipAddress, userAgent);
    return { accessToken: await this.createAccessToken(user, replacement.id), refreshToken: replacement.refreshToken, user };
  }

  async revokeRefreshToken(refreshToken: string | undefined) {
    if (!refreshToken) return;
    await this.sessions.update({ refreshTokenHash: this.hashToken(refreshToken), revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  private async recordLogin(userId: string | null, email: string, successful: boolean, ipAddress?: string, userAgent?: string) {
    await this.loginEvents.save(
      this.loginEvents.create({
        userId,
        email,
        successful,
        ipAddress: ipAddress?.slice(0, 45) ?? null,
        userAgent: userAgent?.slice(0, 512) ?? null,
      }),
    );
  }

  private async recordFailedLogin(user: User) {
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    user.failedLoginAttempts = failedLoginAttempts;
    if (failedLoginAttempts >= 5) user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    await this.users.save(user);
  }

  private async createSession(userId: string, ipAddress?: string, userAgent?: string) {
    const refreshToken = randomBytes(48).toString('hex');
    const session = await this.sessions.save(this.sessions.create({
      userId,
      refreshTokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      ipAddress: ipAddress?.slice(0, 45) ?? null,
      userAgent: userAgent?.slice(0, 512) ?? null,
    }));
    return { ...session, refreshToken };
  }

  private createAccessToken(user: AuthUser, sessionId: string) {
    return this.jwtService.signAsync({ sub: user.id, email: user.email, sid: sessionId } satisfies JwtPayload);
  }

  private async revokeUserSessions(userId: string, exceptSessionId?: string) {
    const builder = this.sessions.createQueryBuilder().update(AuthSession).set({ revokedAt: new Date() }).where('user_id = :userId', { userId }).andWhere('revoked_at IS NULL');
    if (exceptSessionId) builder.andWhere('id != :exceptSessionId', { exceptSessionId });
    await builder.execute();
  }

  private async invalidatePasswordResetTokens(userId: string) {
    await this.resetTokens.update({ userId, usedAt: IsNull() }, { usedAt: new Date() });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
