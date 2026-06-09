import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['facility'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['facility'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'phone', 'facilityId', 'isActive', 'pin'],
    });
  }

  async findByRole(role: string): Promise<User[]> {
    return this.userRepository.find({
      where: { role: role as any, isActive: true },
      relations: ['facility'],
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const hashedPin = dto.pin ? await bcrypt.hash(dto.pin, 10) : null;

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      pin: hashedPin,
    });

    return this.userRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 12);
    }
    if (dto.pin) {
      (dto as any).pin = await bcrypt.hash(dto.pin, 10);
    }

    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async deactivate(id: string): Promise<void> {
    await this.userRepository.update(id, { isActive: false });
  }

  async activate(id: string): Promise<void> {
    await this.userRepository.update(id, { isActive: true });
  }
}
