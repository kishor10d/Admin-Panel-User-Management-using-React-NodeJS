import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginEvent } from '../database/entities';
import { ListLoginEventsQueryDto } from './dto/list-login-events-query.dto';

@Injectable()
export class LoginHistoryService {
  constructor(@InjectRepository(LoginEvent) private readonly loginEvents: Repository<LoginEvent>) {}

  async list(query: ListLoginEventsQueryDto) {
    const builder = this.loginEvents.createQueryBuilder('event').where('event.deleted_at IS NULL').orderBy('event.created_at', 'DESC');
    const search = query.search?.trim();
    if (search) builder.andWhere('(event.email LIKE :search OR event.ip_address LIKE :search OR event.user_agent LIKE :search)', { search: `%${search}%` });
    if (query.successful !== undefined) builder.andWhere('event.successful = :successful', { successful: query.successful });
    if (query.from) builder.andWhere('event.created_at >= :from', { from: new Date(query.from) });
    if (query.to) builder.andWhere('event.created_at <= :to', { to: new Date(query.to) });

    const [items, total] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    return {
      items: items.map((event) => ({ id: event.id, userId: event.userId, email: event.email, ipAddress: event.ipAddress, userAgent: event.userAgent, successful: event.successful, createdAt: event.createdAt })),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }
}
