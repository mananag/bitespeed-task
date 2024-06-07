import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContactModule } from './contact/contact.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './contact/contact.entity';
import { DataSource } from 'typeorm';
import 'dotenv/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.CONNECTION_URL,
      entities: [Contact],
      synchronize: true,
      logging: true,
      ssl: true,
    }),
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
