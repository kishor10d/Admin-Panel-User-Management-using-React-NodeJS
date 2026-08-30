import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { ListLoginEventsQueryDto } from './dto/list-login-events-query.dto';
import { LoginHistoryService } from './login-history.service';

@Controller('login-history')
@UseGuards(AccessTokenGuard, PermissionsGuard)
export class LoginHistoryController {
  constructor(private readonly loginHistoryService: LoginHistoryService) {}

  @Get()
  @RequirePermissions('login-history.read')
  list(@Query() query: ListLoginEventsQueryDto) {
    return this.loginHistoryService.list(query);
  }
}
