import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { Role, User, UserRole } from '../database/entities';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(UserRole) private readonly userRoles: Repository<UserRole>,
  ) {}

  async list(query: ListUsersQueryDto) {
    const builder = this.users.createQueryBuilder('user').where('user.deleted_at IS NULL').orderBy('user.created_at', 'DESC');
    const search = query.search?.trim();
    if (search) {
      builder.andWhere('(user.email LIKE :search OR user.name LIKE :search OR user.mobile LIKE :search)', { search: `%${search}%` });
    }
    const [users, total] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    return {
      items: await this.presentMany(users),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.exist({ where: { email } })) throw new ConflictException('A user with this email already exists.');
    await this.assertRolesExist(dto.roleIds);
    const user = await this.users.save(this.users.create({
      email,
      name: dto.name?.trim() || null,
      mobile: dto.mobile?.trim() || null,
      passwordHash: await bcrypt.hash(dto.password, 12),
      isActive: true,
      mustChangePassword: true,
    }));
    await this.replaceRoles(user.id, dto.roleIds);
    return this.present(user);
  }

  async update(id: string, dto: UpdateUserDto, actingUserId: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    if (dto.isActive === false && id === actingUserId) throw new BadRequestException('You cannot deactivate your own account.');

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.users.findOne({ where: { email } });
      if (existing && existing.id !== id) throw new ConflictException('A user with this email already exists.');
      user.email = email;
    }
    if (dto.name !== undefined) user.name = dto.name.trim() || null;
    if (dto.mobile !== undefined) user.mobile = dto.mobile.trim() || null;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 12);
      user.mustChangePassword = true;
    }
    if (dto.roleIds) await this.assertRolesExist(dto.roleIds);
    const updated = await this.users.save(user);
    if (dto.roleIds) await this.replaceRoles(id, dto.roleIds);
    return this.present(updated);
  }

  async deactivate(id: string, actingUserId: string) {
    return this.update(id, { isActive: false }, actingUserId);
  }

  private async assertRolesExist(roleIds: string[]) {
    const uniqueRoleIds = [...new Set(roleIds)];
    const roles = await this.roles.findBy({ id: In(uniqueRoleIds), isActive: true });
    if (roles.length !== uniqueRoleIds.length) throw new BadRequestException('One or more selected roles do not exist or are inactive.');
  }

  private async replaceRoles(userId: string, roleIds: string[]) {
    await this.userRoles.delete({ userId });
    await this.userRoles.save([...new Set(roleIds)].map((roleId) => this.userRoles.create({ userId, roleId })));
  }

  private async presentMany(users: User[]) {
    if (!users.length) return [];
    const userIds = users.map((user) => user.id);
    const links = await this.userRoles.find({ where: { userId: In(userIds) } });
    const roleIds = [...new Set(links.map((link) => link.roleId))];
    const roles = roleIds.length ? await this.roles.findBy({ id: In(roleIds) }) : [];
    const rolesById = new Map(roles.map((role) => [role.id, { id: role.id, name: role.name }]));
    const rolesByUser = new Map<string, Array<{ id: string; name: string }>>();
    for (const link of links) {
      const role = rolesById.get(link.roleId) ?? { id: link.roleId, name: 'Unknown role' };
      rolesByUser.set(link.userId, [...(rolesByUser.get(link.userId) ?? []), role]);
    }
    return users.map((user) => this.serialize(user, rolesByUser.get(user.id) ?? []));
  }

  private async present(user: User) {
    const items = await this.presentMany([user]);
    return items[0];
  }

  private serialize(user: User, roles: Array<{ id: string; name: string }>) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      mobile: user.mobile,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      roles,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
