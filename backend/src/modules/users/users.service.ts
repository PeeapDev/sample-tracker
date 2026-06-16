import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
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
    'user.staffId',
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

    // Issue the staff badge: a human ID code + its QR for in-app verification.
    const staffId = this.generateStaffId();
    const qrCode = await QRCode.toDataURL(staffId);

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      pin: hashedPin,
      staffId,
      qrCode,
    });

    // The saved entity carries staffId/qrCode/photo in memory so the caller can
    // render the ID card immediately (those columns are select:false on reload).
    return this.userRepository.save(user);
  }

  private generateStaffId(): string {
    const rand = uuidv4().split('-')[0].toUpperCase().slice(0, 6);
    return `STF-${rand}`;
  }

  /// Full card payload for one user (includes the select:false qrCode + photo).
  async getCard(id: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.facility', 'facility')
      .addSelect(['user.qrCode', 'user.photo'])
      .where('user.id = :id', { id })
      .getOne();
    if (!user) throw new NotFoundException('User not found');
    // Backfill a staffId/QR for users enrolled before badges existed.
    if (!user.staffId) {
      user.staffId = this.generateStaffId();
      user.qrCode = await QRCode.toDataURL(user.staffId);
      await this.userRepository.update(user.id, {
        staffId: user.staffId,
        qrCode: user.qrCode,
      });
    }
    return user;
  }

  /// In-app verification: resolve a scanned staff QR (STF-…) to the person.
  async verifyByStaffId(staffId: string): Promise<any> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.facility', 'facility')
      .addSelect('user.photo')
      .where('user.staffId = :staffId', { staffId })
      .getOne();
    if (!user) throw new NotFoundException('No staff member matches this badge');
    return {
      staffId: user.staffId,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      facility: user.facility ? { name: user.facility.name } : null,
      isActive: user.isActive,
      photo: user.photo ?? null,
    };
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
