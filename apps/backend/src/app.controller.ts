import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealthStatus() {
    return {
      status: 'online',
      system: 'Campus Infrastructure Intelligence API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
