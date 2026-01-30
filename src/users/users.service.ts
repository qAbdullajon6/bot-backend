import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import { SearchService } from "../search/search.service";
import { SettingsService } from "../settings/settings.service";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly searchService: SearchService,
    private readonly settingsService: SettingsService,
  ) {}

  create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  findOneByUsername(username: string) {
    return this.usersRepository.findOneBy({ username });
  }

  findOneByTelegramId(telegramId: string) {
    return this.usersRepository.findOneBy({ telegramId });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async updatePhoto(id: number, photoUrl: string) {
    await this.usersRepository.update(id, { photoUrl });
  }

  async incrementQueryUsage(id: number) {
    const user = await this.findOne(id);
    if (!user) return;

    if (user.hasSubscription) {
      user.paidQueriesUsed += 1;
      await this.usersRepository.save(user);
    } else {
      const freeLimitStr = await this.settingsService.get("FREE_QUERY_LIMIT");
      const freeLimit = parseInt(freeLimitStr || "10", 10);

      if (user.freeQueriesUsed < freeLimit) {
        user.freeQueriesUsed += 1;
        await this.usersRepository.save(user);
      }
    }
  }

  async activateSubscription(id: number) {
    const user = await this.findOne(id);
    if (user) {
      user.hasSubscription = true;
      user.subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      await this.usersRepository.save(user);
    }
  }

  remove(id: number) {
    return this.usersRepository.delete(id);
  }

  async getUserDetails(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ["payments"],
    });

    if (!user) return null;

    let searchHistory: any[] = [];
    if (user.telegramId) {
      searchHistory = await this.searchService.findByUserId(user.telegramId);
    }

    const freeLimitStr = await this.settingsService.get("FREE_QUERY_LIMIT");
    const freeLimit = parseInt(freeLimitStr || "10", 10);

    return {
      ...user,
      searchHistory,
      freeLimit,
    };
  }
}
