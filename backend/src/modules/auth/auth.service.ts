import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { RegisterDto, LoginDto, PinLoginDto } from './dto/auth.dto';
import { UserRole } from '../../database/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    if (dto.role === UserRole.DISPATCHER && !dto.pin) {
      throw new BadRequestException('PIN is required for dispatchers');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const hashedPin = dto.pin ? await bcrypt.hash(dto.pin, 10) : null;

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      pin: hashedPin,
    });

    await this.userRepository.save(user);

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const { password, pin, refreshToken, ...userData } = user;
    return { user: userData, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'phone', 'facilityId', 'isActive'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const fullUser = await this.userRepository.findOne({
      where: { id: user.id },
    });

    const tokens = await this.generateTokens(fullUser);
    await this.updateRefreshToken(fullUser.id, tokens.refreshToken);

    const { password, pin, refreshToken, ...userData } = fullUser;
    return { user: userData, ...tokens };
  }

  async pinLogin(dto: PinLoginDto) {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId, role: UserRole.DISPATCHER },
      select: ['id', 'email', 'pin', 'firstName', 'lastName', 'role', 'phone', 'facilityId', 'isActive'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid dispatcher');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPinValid = await bcrypt.compare(dto.pin, user.pin);
    if (!isPinValid) {
      throw new UnauthorizedException('Invalid PIN');
    }

    const fullUser = await this.userRepository.findOne({
      where: { id: user.id },
    });

    const tokens = await this.generateTokens(fullUser);
    await this.updateRefreshToken(fullUser.id, tokens.refreshToken);

    const { password, pin, refreshToken, ...userData } = fullUser;
    return { user: userData, ...tokens };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'refreshToken', 'firstName', 'lastName', 'role', 'phone', 'facilityId', 'isActive'],
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const fullUser = await this.userRepository.findOne({
      where: { id: user.id },
    });

    const tokens = await this.generateTokens(fullUser);
    await this.updateRefreshToken(fullUser.id, tokens.refreshToken);

    const { password, pin, refreshToken: rt, ...userData } = fullUser;
    return { user: userData, ...tokens };
  }

  async logout(userId: string) {
    await this.userRepository.update(userId, { refreshToken: null });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.accessExpiry'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiry'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, { refreshToken: hashedToken });
  }
}
