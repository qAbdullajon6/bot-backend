import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async onModuleInit() {
    // Seed default settings
    const defaultSettings = [
      { key: 'FREE_QUERY_LIMIT', value: '10' },
    ];

    for (const setting of defaultSettings) {
      const exists = await this.settingsRepository.findOneBy({ key: setting.key });
      if (!exists) {
        await this.settingsRepository.save(setting);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    const setting = await this.settingsRepository.findOneBy({ key });
    return setting ? setting.value : null;
  }

  async set(key: string, value: string): Promise<Setting> {
    const setting = this.settingsRepository.create({ key, value });
    return this.settingsRepository.save(setting);
  }

  async findAll() {
    return this.settingsRepository.find();
  }
}
