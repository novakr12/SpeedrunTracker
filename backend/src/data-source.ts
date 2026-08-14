import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'speedrun',
  password: process.env.DB_PASSWORD ?? 'speedrun',
  database: process.env.DB_NAME ?? 'speedrun',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
