import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: 'ok';
  database: 'disabled' | 'configured';
}

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      database: process.env.DATABASE_ENABLED === 'true' ? 'configured' : 'disabled',
    };
  }
}
