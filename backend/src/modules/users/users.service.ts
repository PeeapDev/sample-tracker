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
  // Columns safe to expose in list responses. Deliberately omits `password`
  // (already select:false), `pin`, and `refreshToken` — a plain `find` returns
  // pin and refreshToken, leaking credentials. Using an explicit select via a
  // QueryBuilder also bypasses the eager facility relation cascade.
  private static readonly SAFE_COLUMNS = [
    'user.id',
    'user.email',
    'user.phone',
    'user.firstName',
    'user.lastName',
    'user.role',
    'user.facilityId',
    'user.isActive',
    'user.isVerified',
    'user.createdAt',
    'user.updatedAt',
    'facility.id',
    'facility.name',
    'facility.district',
  ];
  private static readonly LIST_CAP = 500;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private safeQuery() {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.facility', 'facility')
      .select(UsersService.SAFE_COLUMNS);
  }

  async findAll(): Promise<User[]> {
    return this.safeQuery()
      .orderBy('user.createdAt', 'DESC')
      .take(UsersService.LIST_CAP)
      .getMany();
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
    return this.safeQuery()
      .where('user.role = :role', { role })
      .andWhere('user.isActive = true')
      .orderBy('user.createdAt', 'DESC')
      .take(UsersService.LIST_CAP)
      .getMany();
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
