import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSession, LoginEvent, PasswordResetToken, Permission, Role, RolePermission, User, UserRole } from '../database/entities';
import { AccessTokenGuard } from './access-token.guard';
import { CsrfGuard } from './csrf.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PermissionsGuard } from './permissions.guard';
import { PasswordChangeRequiredGuard } from './password-change-required.guard';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([{ name: 'auth', ttl: 60_000, limit: 10 }]),
    MailModule,
    TypeOrmModule.forFeature([User, Role, Permission, UserRole, RolePermission, LoginEvent, PasswordResetToken, AuthSession]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_SECRET');
        if (!secret) throw new Error('JWT_ACCESS_SECRET must be set in apps/api/.env.');
        return { secret, signOptions: { expiresIn: '15m' } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenGuard, CsrfGuard, PermissionsGuard, PasswordChangeRequiredGuard],
  exports: [AuthService, AccessTokenGuard, CsrfGuard, PermissionsGuard, PasswordChangeRequiredGuard],
})
export class AuthModule {}
