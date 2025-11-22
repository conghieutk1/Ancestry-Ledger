import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async findAll(memberId?: string): Promise<Media[]> {
    if (memberId) {
      return this.mediaRepository.find({ where: { member: { id: memberId } } });
    }
    return this.mediaRepository.find();
  }

  async create(mediaData: Partial<Media>): Promise<Media> {
    const media = this.mediaRepository.create(mediaData);
    return this.mediaRepository.save(media);
  }

  async remove(id: string): Promise<void> {
    await this.mediaRepository.delete(id);
  }
}
