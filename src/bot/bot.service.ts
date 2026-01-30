import { OnModuleInit } from "@nestjs/common";
import {
  Update,
  Ctx,
  Start,
  On,
  Message,
  InjectBot,
  Action,
} from "nestjs-telegraf";
import { UseGuards } from "@nestjs/common";
import { BlockedUserGuard } from "./guards/blocked.guard";
import { Context, Telegraf, Markup } from "telegraf";
import { UsersService } from "../users/users.service";
import { SearchService } from "../search/search.service";
import { SettingsService } from "../settings/settings.service";
import { PaymentsService } from "../payments/payments.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import * as fs from "fs";
import * as path from "path";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual } from "typeorm";
import { Broadcast } from "./entities/broadcast.entity";

@Update()
export class BotService implements OnModuleInit {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly usersService: UsersService,
    private readonly searchService: SearchService,
    private readonly settingsService: SettingsService,
    private readonly paymentsService: PaymentsService,
    @InjectRepository(Broadcast)
    private broadcastRepository: Repository<Broadcast>,
  ) {
    // Middleware setup moved to onModuleInit or kept here?
    // It's fine here as constructor runs before onModuleInit
    this.bot.use(async (ctx, next) => {
      // ... existing middleware logic
      if (ctx.from) {
        const user = await this.usersService.findOneByTelegramId(
          ctx.from.id.toString(),
        );
        if (user && user.isBlocked) {
          console.log(`Blocked user ${ctx.from.id} tried to interact.`);
          try {
            if (ctx.message || ctx.callbackQuery) {
              await ctx.reply(
                "🚫 Sizning hisobingiz bloklangan. Botdan foydalana olmaysiz.",
              );
            }
          } catch (e) {
            console.error("Failed to reply to blocked user", e);
          }
          return;
        }
      }
      await next();
    });
  }

  async onModuleInit() {
    try {
      console.log("Launching Telegram Bot...");
      // Do not await launch, as it might block if using long-polling or if it resolves only on stop
      this.bot
        .launch()
        .then(() => {
          console.log("Telegram Bot stopped.");
        })
        .catch((error) => {
          console.error("Failed to launch Telegram Bot inside promise:", error);
          if (error.response && error.response.error_code === 401) {
            console.error(
              "❌ Telegram Token is invalid! Please check TELEGRAM_BOT_TOKEN in .env file.",
            );
          }
        });
      console.log("Telegram Bot launch initiated (background).");
    } catch (error) {
      console.error("Error during bot launch init:", error);
    }
  }

  @Start()
  async start(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const { id, username, first_name, last_name } = ctx.from;

    let user = await this.usersService.findOneByTelegramId(id.toString());

    if (!user) {
      await this.usersService.create({
        telegramId: id.toString(),
        username: username,
        firstName: first_name,
        lastName: last_name,
      });
      await ctx.reply(
        `Assalomu alaykum, ${first_name}! Botga xush kelibsiz.\n\n` +
          `Men sizga dori yo'riqnomalarini topishda yordam beraman.\n` +
          `Shunchaki qidirmoqchi bo'lgan so'zingizni yozing.`,
      );
    } else {
      await ctx.reply(
        `Qaytganingizdan xursandmiz, ${first_name}! Qidirish uchun so'z yozing.`,
      );
    }

    // Update profile photo
    try {
      const photos = await ctx.telegram.getUserProfilePhotos(id);
      if (photos && photos.total_count > 0) {
        // Get the biggest photo (last in the array)
        const photo = photos.photos[0][photos.photos[0].length - 1];
        const fileLink = await ctx.telegram.getFileLink(photo.file_id);

        // Check if user exists (if we just created, we need to find again or use the object)
        const currentUser = await this.usersService.findOneByTelegramId(
          id.toString(),
        );
        if (currentUser) {
          const uploadDir = path.join(process.cwd(), "uploads", "avatars");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const fileName = `${currentUser.id}_${Date.now()}.jpg`;
          const filePath = path.join(uploadDir, fileName);

          // Download file with a timeout signal to prevent hanging indefinitely
          // Using fetch with custom dispatcher or just catching the error
          try {
            // Basic fetch
            const response = await fetch(fileLink.href);
            if (response.ok && response.body) {
              const buffer = Buffer.from(await response.arrayBuffer());
              fs.writeFileSync(filePath, buffer);

              const photoUrl = `http://localhost:4000/uploads/avatars/${fileName}`;
              await this.usersService.updatePhoto(currentUser.id, photoUrl);
            }
          } catch (fetchError) {
            console.error(
              "Failed to download profile photo (network/timeout):",
              fetchError.message,
            );
            // Do not crash, just skip photo update
          }
        }
      }
    } catch (e) {
      console.error("Error fetching/saving user profile photo:", e);
    }
  }

  @On("text")
  async onMessage(@Message("text") text: string, @Ctx() ctx: Context) {
    if (text.startsWith("/")) return; // Ignore commands
    if (!ctx.from) return;

    // Check payment flow state
    // Ideally use session or a state machine, but for simplicity we handle it here or via button callbacks
    // If text is a card number? We are simulating payment via buttons for now as per requirement.

    const user = await this.usersService.findOneByTelegramId(
      ctx.from.id.toString(),
    );
    if (!user) return;

    // Check limits
    if (!user.hasSubscription) {
      const freeLimitStr = await this.settingsService.get("FREE_QUERY_LIMIT");
      const freeLimit = parseInt(freeLimitStr || "10", 10);

      if (user.freeQueriesUsed >= freeLimit) {
        await ctx.reply(
          `❌ Sizning bepul so'rovlaringiz limiti tugadi (${freeLimit}/${freeLimit}).\n\n` +
            `Davom ettirish uchun PRO tarifiga o'tishingiz kerak.`,
          Markup.inlineKeyboard([
            [Markup.button.callback("🚀 PRO Tarifiga o'tish", "upgrade_pro")],
          ]),
        );
        return;
      }
    }

    await ctx.reply("🔍 Qidirilmoqda...");

    try {
      const results = await this.searchService.search(
        text,
        ctx.from?.id.toString(),
        ctx.from?.username,
      );

      // Increment query usage
      await this.usersService.incrementQueryUsage(user.id);

      if (results.length === 0) {
        await ctx.reply("❌ Hech narsa topilmadi.");
        return;
      }

      // Send top 5 results
      for (const hit of results.slice(0, 5)) {
        const source = hit.source as any;
        if (!source) continue;

        const highlights =
          hit.highlight && hit.highlight.content ? hit.highlight.content : [];

        let message = `📄 <b>${source.title || source.filename}</b>\n\n`;

        if (highlights.length > 0) {
          // Remove <em> tags or replace them with <u> or <b>
          const formattedHighlights = highlights.map((h: string) =>
            h.replace(/<em>/g, "<u>").replace(/<\/em>/g, "</u>"),
          );
          message += formattedHighlights.join("...\n\n") + "...";
        } else {
          message +=
            (source.content ? source.content.substring(0, 200) : "") + "...";
        }

        await ctx.replyWithHTML(message);
      }
    } catch (error) {
      console.error(error);
      await ctx.reply("⚠️ Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.");
    }
  }

  @Action("upgrade_pro")
  async onUpgradePro(@Ctx() ctx: Context) {
    await ctx.deleteMessage();
    await ctx.reply(
      `💳 <b>To'lov (Test Rejimi)</b>\n\n` +
        `PRO tarifi narxi: <b>50,000 so'm / oy</b>\n\n` +
        `To'lov qilish uchun pastdagi tugmani bosing.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("💳 Karta orqali to'lash", "pay_card")],
      ]),
    );
  }

  @Action("pay_card")
  async onPayCard(@Ctx() ctx: Context) {
    await ctx.deleteMessage();
    // Simulate asking for card
    await ctx.reply(
      `Iltimos, karta raqamingizni kiriting (Test uchun ixtiyoriy raqam):`,
      Markup.forceReply(),
    );
    // Note: Handling the reply requires session or checking reply_to_message.
    // For this simple task, let's just simulate the success immediately on next text or button.
    // But better: show a "Pay" button that just works.

    // Let's restart the flow to be simpler and button driven as requested "shunchaki malumotlarini kiritadi va biz qabul qilib yechib olganday qilamiz"

    await ctx.reply(`To'lov amalga oshirilmoqda... 🔄`);

    setTimeout(async () => {
      if (!ctx.from) return;
      const user = await this.usersService.findOneByTelegramId(
        ctx.from.id.toString(),
      );
      if (user) {
        await this.usersService.activateSubscription(user.id);
        // Record payment
        await this.paymentsService.create({
          userId: user.id,
          amount: 50000,
          currency: "UZS",
          status: "completed",
        });
        await ctx.reply(
          `✅ <b>To'lov muvaffaqiyatli amalga oshirildi!</b>\n\nSiz endi PRO tarifidasiz. Cheklovsiz qidirishingiz mumkin.`,
        );
      }
    }, 2000);
  }

  async broadcast(
    message: string,
    imagePaths: string[] = [],
    scheduledFor?: Date,
    audience: string = "all",
  ) {
    if (scheduledFor) {
      const broadcast = this.broadcastRepository.create({
        message,
        imagePaths,
        audience,
        status: "scheduled",
        recipientCount: 0,
        deliveredCount: 0,
        scheduledFor,
      });
      await this.broadcastRepository.save(broadcast);
      return;
    }

    let users: any[] = [];
    if (audience === "subscribed") {
      users = await this.usersService
        .findAll()
        .then((all) => all.filter((u) => u.hasSubscription));
    } else if (audience === "non-subscribed") {
      users = await this.usersService
        .findAll()
        .then((all) => all.filter((u) => !u.hasSubscription));
    } else {
      users = await this.usersService.findAll();
    }

    let deliveredCount = 0;

    for (const user of users) {
      if (!user.telegramId) continue;
      try {
        if (imagePaths && imagePaths.length > 0) {
          // Resolve absolute paths
          const resolvedPaths = imagePaths.map((p) =>
            path.resolve(process.cwd(), p),
          );

          // Check if files exist
          const validPaths = resolvedPaths.filter((p) => fs.existsSync(p));

          if (validPaths.length === 0) {
            console.error(
              `No valid images found for broadcast. Paths: ${imagePaths.join(", ")}`,
            );
            // Fallback to text only
            await this.bot.telegram.sendMessage(user.telegramId, message);
          } else if (validPaths.length === 1) {
            console.log(
              `Sending photo to ${user.telegramId}: ${validPaths[0]}`,
            );
            await this.bot.telegram.sendPhoto(
              user.telegramId,
              { source: fs.createReadStream(validPaths[0]) },
              { caption: message },
            );
          } else {
            // Send album
            console.log(
              `Sending album to ${user.telegramId}: ${validPaths.join(", ")}`,
            );
            const mediaGroup = validPaths.map((p, index) => ({
              type: "photo" as const,
              media: { source: fs.createReadStream(p) },
              caption: index === 0 ? message : undefined, // Caption only on first image
            }));
            await this.bot.telegram.sendMediaGroup(user.telegramId, mediaGroup);
          }
        } else {
          await this.bot.telegram.sendMessage(user.telegramId, message);
        }
        deliveredCount++;
      } catch (e) {
        console.error(`Failed to send to ${user.telegramId}`, e);
      }
    }

    const broadcast = this.broadcastRepository.create({
      message,
      imagePaths,
      audience,
      status: "sent",
      recipientCount: users.length,
      deliveredCount: deliveredCount,
    });
    await this.broadcastRepository.save(broadcast);
  }

  findAllBroadcasts() {
    return this.broadcastRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async getStats() {
    const totalBroadcasts = await this.broadcastRepository.count();
    const totalUsers = await this.usersService
      .findAll()
      .then((users) => users.length);
    const activeSubscribers = await this.usersService
      .findAll()
      .then((users) => users.filter((u) => u.hasSubscription).length);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = await this.broadcastRepository
      .createQueryBuilder("broadcast")
      .where("broadcast.createdAt >= :startOfMonth", { startOfMonth })
      .getCount();

    const scheduled = await this.broadcastRepository.count({
      where: { status: "scheduled" },
    });

    const totalReachResult = await this.broadcastRepository
      .createQueryBuilder("broadcast")
      .select("SUM(broadcast.deliveredCount)", "sum")
      .getRawOne();

    const totalReach = totalReachResult
      ? parseInt(totalReachResult.sum, 10) || 0
      : 0;

    return {
      totalBroadcasts,
      thisMonth,
      scheduled,
      totalReach,
      totalUsers,
      activeSubscribers,
    };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledBroadcasts() {
    const now = new Date();
    const pendingBroadcasts = await this.broadcastRepository.find({
      where: {
        status: "scheduled",
        scheduledFor: LessThanOrEqual(now),
      },
    });

    for (const broadcast of pendingBroadcasts) {
      // Send the broadcast
      let users: any[] = [];
      if (broadcast.audience === "subscribed") {
        users = await this.usersService
          .findAll()
          .then((all) => all.filter((u) => u.hasSubscription));
      } else if (broadcast.audience === "non-subscribed") {
        users = await this.usersService
          .findAll()
          .then((all) => all.filter((u) => !u.hasSubscription));
      } else {
        users = await this.usersService.findAll();
      }

      let deliveredCount = 0;

      for (const user of users) {
        if (!user.telegramId) continue;
        try {
          if (broadcast.imagePaths && broadcast.imagePaths.length > 0) {
            // Resolve absolute paths
            const resolvedPaths = broadcast.imagePaths.map((p) =>
              path.resolve(process.cwd(), p),
            );
            const validPaths = resolvedPaths.filter((p) => fs.existsSync(p));

            if (validPaths.length === 0) {
              await this.bot.telegram.sendMessage(
                user.telegramId,
                broadcast.message,
              );
            } else if (validPaths.length === 1) {
              await this.bot.telegram.sendPhoto(
                user.telegramId,
                { source: fs.createReadStream(validPaths[0]) },
                { caption: broadcast.message },
              );
            } else {
              const mediaGroup = validPaths.map((p, index) => ({
                type: "photo" as const,
                media: { source: fs.createReadStream(p) },
                caption: index === 0 ? broadcast.message : undefined,
              }));
              await this.bot.telegram.sendMediaGroup(
                user.telegramId,
                mediaGroup,
              );
            }
          } else {
            await this.bot.telegram.sendMessage(
              user.telegramId,
              broadcast.message,
            );
          }
          deliveredCount++;
        } catch (e) {
          console.error(
            `Failed to send scheduled broadcast to ${user.telegramId}`,
            e,
          );
        }
      }

      // Update broadcast status
      broadcast.status = "sent";
      broadcast.deliveredCount = deliveredCount;
      broadcast.recipientCount = users.length;
      await this.broadcastRepository.save(broadcast);
    }
  }
}
