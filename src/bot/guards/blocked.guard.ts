import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../users/users.service';

@Injectable()
export class BlockedUserGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = TelegrafExecutionContext.create(context);
    const telegrafCtx = ctx.getContext<Context>();
    const telegramId = telegrafCtx.from?.id;

    if (!telegramId) {
      return true; 
    }

    console.log(`Checking blocked status for Telegram ID: ${telegramId}`);
    try {
      const user = await this.usersService.findOneByTelegramId(telegramId.toString());
      console.log(`User found: ${user ? 'Yes' : 'No'}, Blocked: ${user?.isBlocked}`);

      if (user && user.isBlocked) {
        console.log(`User ${telegramId} is blocked. Sending notification.`);
        try {
          await telegrafCtx.reply('🚫 Sizning hisobingiz bloklangan. Botdan foydalana olmaysiz.');
        } catch (e) {
          console.error('Failed to reply to blocked user:', e);
        }
        return false;
      }
    } catch (error) {
      console.error('Error in BlockedUserGuard:', error);
    }

    return true;
  }
}
