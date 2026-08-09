import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getSystemInfo() {
    return {
      status: 'ok',
      system: 'Campus Infrastructure Intelligence API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealthStatus() {
    return {
      status: 'ok',
      system: 'Campus Infrastructure Intelligence API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
