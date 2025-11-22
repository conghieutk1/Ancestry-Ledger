import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOneById(id: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['member'],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  // Alias for create to match auth.service usage
  async createUser(userData: Partial<User>): Promise<User> {
    return this.create(userData);
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    return this.findOneById(id);
  }

  // Alias for update to match controller usage
  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    return this.update(id, updateData);
  }

  async deleteUser(id: string): Promise<void> {
    // Check if user is linked to a member
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['member'],
    });

    if (user?.member) {
      throw new Error(
        `Cannot delete user. This user is linked to member: ${user.member.fullName}. Please unlink the member first.`,
      );
    }

    await this.userRepository.delete(id);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}
