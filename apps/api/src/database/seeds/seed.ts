import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { Permission, Role, RolePermission, User, UserRole } from '../entities';
import { DEFAULT_PERMISSIONS } from '../../auth/permissions';

async function seed() {
  if (process.env.DATABASE_ENABLED !== 'true') {
    throw new Error('Set DATABASE_ENABLED=true in apps/api/.env before seeding a database.');
  }
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('Set ADMIN_PASSWORD to a unique password with at least 12 characters in apps/api/.env.');
  }

  await dataSource.initialize();
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);
  const rolePermissionRepository = dataSource.getRepository(RolePermission);
  const userRepository = dataSource.getRepository(User);
  const userRoleRepository = dataSource.getRepository(UserRole);

  let adminRole = await roleRepository.findOne({ where: { name: 'System Administrator' } });
  if (!adminRole) {
    adminRole = await roleRepository.save(roleRepository.create({ name: 'System Administrator', description: 'Full access to all administration features', isActive: true }));
  }

  for (const key of DEFAULT_PERMISSIONS) {
    const permission = await permissionRepository.findOne({ where: { key } })
      ?? await permissionRepository.save(permissionRepository.create({ key }));
    const link = await rolePermissionRepository.findOne({ where: { roleId: adminRole.id, permissionId: permission.id } });
    if (!link) await rolePermissionRepository.save(rolePermissionRepository.create({ roleId: adminRole.id, permissionId: permission.id }));
  }

  const email = (process.env.ADMIN_EMAIL ?? 'admin@example.com').trim().toLowerCase();
  let admin = await userRepository.findOne({ where: { email } });
  if (!admin) {
    admin = await userRepository.save(userRepository.create({
      email,
      name: 'System Administrator',
      passwordHash: await bcrypt.hash(adminPassword, 12),
      isActive: true,
      mustChangePassword: true,
    }));
  }

  const userRole = await userRoleRepository.findOne({ where: { userId: admin.id, roleId: adminRole.id } });
  if (!userRole) await userRoleRepository.save(userRoleRepository.create({ userId: admin.id, roleId: adminRole.id }));

  await dataSource.destroy();
  console.log(`Seed complete. Administrator: ${email}`);
}

void seed();
