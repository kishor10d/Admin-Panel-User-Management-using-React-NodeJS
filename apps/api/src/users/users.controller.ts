import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard, type AuthenticatedRequest } from '../auth/access-token.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AccessTokenGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users.read')
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Post()
  @RequirePermissions('users.create')
  create(@Body() dto: CreateUserDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.create(dto, request.currentUser!);
  }

  @Patch(':id')
  @RequirePermissions('users.update')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.update(id, dto, request.currentUser!);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('users.delete')
  deactivate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.deactivate(id, request.currentUser!);
  }

  @Patch(':id/activate')
  @RequirePermissions('users.update')
  activate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.activate(id, request.currentUser!);
  }
}
