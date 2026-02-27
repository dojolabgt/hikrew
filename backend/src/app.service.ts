import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      status: 'ok',
      name: 'API',
      version: '1.0.0',
    };
  }
}
