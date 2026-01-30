import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { BotModule } from './bot/bot.module';
import { SearchModule } from './search/search.module';
import { User } from './users/entities/user.entity';
import { Document } from './documents/entities/document.entity';

import { ScheduleModule } from '@nestjs/schedule';
import { SettingsModule } from './settings/settings.module';
import { PaymentsModule } from './payments/payments.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { SearchQuery } from './search/entities/search-query.entity';
import { SynonymsModule } from './synonyms/synonyms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST', 'localhost'),
        port: configService.get<number>('POSTGRES_PORT', 5432),
        username: configService.get<string>('POSTGRES_USER', 'postgres'),
        password: configService.get<string>('POSTGRES_PASSWORD', '1234'),
        database: configService.get<string>('POSTGRES_DATABASE', 'telegram_bot_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    DocumentsModule,
    BotModule,
    SearchModule,
    SettingsModule,
    TypeOrmModule.forFeature([User, Document, SearchQuery]),
    PaymentsModule,
    SynonymsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
