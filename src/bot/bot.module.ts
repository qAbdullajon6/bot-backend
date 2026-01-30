import { Module } from "@nestjs/common";
import { TelegrafModule } from "nestjs-telegraf";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BotService } from "./bot.service";
import { BlockedUserGuard } from "./guards/blocked.guard";
import { BotController } from "./bot.controller";
import { UsersModule } from "../users/users.module";
import { SearchModule } from "../search/search.module";
import { SettingsModule } from "../settings/settings.module";
import { Broadcast } from "./entities/broadcast.entity";
import { diskStorage } from "multer";
import { extname } from "path";

import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>("TELEGRAM_BOT_TOKEN");
        if (!token || token === "YOUR_BOT_TOKEN_HERE") {
          console.warn(
            "TELEGRAM_BOT_TOKEN is missing or invalid. Bot functionality will be disabled.",
          );
          return {
            token: "123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            launchOptions: false,
          };
        }
        return {
          token: token,
          launchOptions: false, // Handle launch manually in BotService to catch errors
        };
      },
      inject: [ConfigService],
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
    TypeOrmModule.forFeature([Broadcast]),
    UsersModule,
    SearchModule,
    SettingsModule,
    PaymentsModule,
  ],
  controllers: [BotController],
  providers: [BotService, BlockedUserGuard],
})
export class BotModule {}
