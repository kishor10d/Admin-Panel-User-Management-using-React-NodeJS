import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { In, IsNull, Repository } from 'typeorm';
import { LoginEvent, PasswordResetToken, Permission, Role, RolePermission, User, UserRole } from '../database/entities';
import type { AuthUser, JwtPayload } from './auth-user.type';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
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
  ) {}

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email: normalizedEmail } });
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !user.isActive || !passwordMatches) {
      await this.recordLogin(user?.id ?? null, normalizedEmail, false, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.recordLogin(user.id, user.email, true, ipAddress, userAgent);
    const currentUser = await this.getCurrentUser(user.id);
    const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email } satisfies JwtPayload);
    return { accessToken, user: currentUser };
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
      roles: roles.map((role) => role.name),
      permissions: permissions.map((permission) => permission.key),
    };
  }

  async verifyAccessToken(token: string): Promise<AuthUser> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return this.getCurrentUser(payload.sub);
    } catch {
      throw new UnauthorizedException();
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) throw new UnauthorizedException('Current password is incorrect.');
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await this.users.save(user);
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
    await this.resetTokens.save(this.resetTokens.create({ userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000), usedAt: null }));

    if (this.config.get<string>('NODE_ENV') !== 'production') {
      const webOrigin = this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:5173';
      console.info(`Development password-reset link for ${user.email}: ${webOrigin}/reset-password?token=${token}`);
    }
  }

  async resetPassword(token: string, password: string) {
    const resetToken = await this.resetTokens.findOne({ where: { tokenHash: this.hashToken(token) } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) throw new BadRequestException('This password-reset link is invalid or expired.');
    const user = await this.users.findOne({ where: { id: resetToken.userId } });
    if (!user || !user.isActive) throw new BadRequestException('This password-reset link is invalid or expired.');
    user.passwordHash = await bcrypt.hash(password, 12);
    user.mustChangePassword = false;
    resetToken.usedAt = new Date();
    await this.users.save(user);
    await this.resetTokens.save(resetToken);
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

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
