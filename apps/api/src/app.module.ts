import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthController } from './health/health.controller';

const databaseEnabled = process.env.DATABASE_ENABLED === 'true';
const databaseModule = databaseEnabled
  ? (() => {
      // Loading TypeORM only when a database is configured keeps local UI/API
      // development usable before any MySQL credentials exist.
      const { TypeOrmModule } = require('@nestjs/typeorm') as typeof import('@nestjs/typeorm');
      const { databaseOptions } = require('./database/database.options') as typeof import('./database/database.options');
      return TypeOrmModule.forRootAsync({ inject: [ConfigService], useFactory: databaseOptions });
    })()
  : undefined;
const applicationModules = databaseEnabled
  ? [
      require('./auth/auth.module').AuthModule as typeof import('./auth/auth.module').AuthModule,
      require('./roles/roles.module').RolesModule as typeof import('./roles/roles.module').RolesModule,
      require('./users/users.module').UsersModule as typeof import('./users/users.module').UsersModule,
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(databaseModule ? [databaseModule] : []),
    ...applicationModules,
  ],
  controllers: [HealthController],
})
export class AppModule {}
