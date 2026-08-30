import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { LoginEvent, Permission, Role, RolePermission, User, UserRole } from '../database/entities';
import type { AuthUser, JwtPayload } from './auth-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(Permission) private readonly permissions: Repository<Permission>,
    @InjectRepository(UserRole) private readonly userRoles: Repository<UserRole>,
    @InjectRepository(RolePermission) private readonly rolePermissions: Repository<RolePermission>,
    @InjectRepository(LoginEvent) private readonly loginEvents: Repository<LoginEvent>,
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
}
