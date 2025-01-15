import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    try {
      const result = await this.connection.query('SELECT NOW()');
      console.log('Database connection successful:', result);
    } catch (error) {
      console.error('Database connection failed:', error);
    }
  }
}
