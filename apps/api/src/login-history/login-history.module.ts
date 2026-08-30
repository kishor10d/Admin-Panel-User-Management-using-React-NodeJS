import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { LoginEvent } from '../database/entities';
import { LoginHistoryController } from './login-history.controller';
import { LoginHistoryService } from './login-history.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([LoginEvent])],
  controllers: [LoginHistoryController],
  providers: [LoginHistoryService],
})
export class LoginHistoryModule {}
