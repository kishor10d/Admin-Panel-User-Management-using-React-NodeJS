import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission, Role, RolePermission } from '../database/entities';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(Permission) private readonly permissions: Repository<Permission>,
    @InjectRepository(RolePermission) private readonly rolePermissions: Repository<RolePermission>,
  ) {}

  async list(includeInactive = false) {
    const roles = await this.roles.find({ where: includeInactive ? {} : { isActive: true }, order: { name: 'ASC' } });
    return { roles: await this.presentMany(roles) };
  }

  async listPermissions() {
    const permissions = await this.permissions.find({ order: { key: 'ASC' } });
    return { permissions: permissions.map((permission) => ({ id: permission.id, key: permission.key, description: permission.description })) };
  }

  async create(dto: CreateRoleDto) {
    const name = dto.name.trim();
    if (await this.roles.exist({ where: { name } })) throw new ConflictException('A role with this name already exists.');
    await this.assertPermissionsExist(dto.permissionIds);
    const role = await this.roles.save(this.roles.create({ name, description: dto.description?.trim() || null, isActive: true }));
    await this.replacePermissions(role.id, dto.permissionIds);
    return this.present(role);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.roles.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found.');
    if (dto.isActive === false && role.name === 'System Administrator') throw new BadRequestException('The System Administrator role cannot be deactivated.');

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const existing = await this.roles.findOne({ where: { name } });
      if (existing && existing.id !== id) throw new ConflictException('A role with this name already exists.');
      role.name = name;
    }
    if (dto.description !== undefined) role.description = dto.description.trim() || null;
    if (dto.isActive !== undefined) role.isActive = dto.isActive;
    if (dto.permissionIds) await this.assertPermissionsExist(dto.permissionIds);
    const updated = await this.roles.save(role);
    if (dto.permissionIds) await this.replacePermissions(id, dto.permissionIds);
    return this.present(updated);
  }

  async deactivate(id: string) {
    return this.update(id, { isActive: false });
  }

  private async assertPermissionsExist(permissionIds: string[]) {
    const uniqueIds = [...new Set(permissionIds)];
    const permissions = uniqueIds.length ? await this.permissions.findBy({ id: In(uniqueIds) }) : [];
    if (permissions.length !== uniqueIds.length) throw new BadRequestException('One or more selected permissions do not exist.');
  }

  private async replacePermissions(roleId: string, permissionIds: string[]) {
    await this.rolePermissions.delete({ roleId });
    const uniqueIds = [...new Set(permissionIds)];
    if (uniqueIds.length) await this.rolePermissions.save(uniqueIds.map((permissionId) => this.rolePermissions.create({ roleId, permissionId })));
  }

  private async presentMany(roles: Role[]) {
    if (!roles.length) return [];
    const links = await this.rolePermissions.find({ where: { roleId: In(roles.map((role) => role.id)) } });
    const permissionIds = [...new Set(links.map((link) => link.permissionId))];
    const permissions = permissionIds.length ? await this.permissions.findBy({ id: In(permissionIds) }) : [];
    const permissionsById = new Map(permissions.map((permission) => [permission.id, { id: permission.id, key: permission.key, description: permission.description }]));
    const permissionsByRole = new Map<string, Array<{ id: string; key: string; description: string | null }>>();
    for (const link of links) {
      const permission = permissionsById.get(link.permissionId);
      if (permission) permissionsByRole.set(link.roleId, [...(permissionsByRole.get(link.roleId) ?? []), permission]);
    }
    return roles.map((role) => this.serialize(role, permissionsByRole.get(role.id) ?? []));
  }

  private async present(role: Role) {
    const items = await this.presentMany([role]);
    return items[0];
  }

  private serialize(role: Role, permissions: Array<{ id: string; key: string; description: string | null }>) {
    return { id: role.id, name: role.name, description: role.description, isActive: role.isActive, permissions, createdAt: role.createdAt, updatedAt: role.updatedAt };
  }
}
