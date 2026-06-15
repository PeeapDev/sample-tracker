import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from '../../database/entities/facility.entity';
import { CreateFacilityDto, UpdateFacilityDto } from './dto/facility.dto';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Facility)
    private facilityRepository: Repository<Facility>,
  ) {}

  findAll(type?: string): Promise<Facility[]> {
    const where = type ? { type } : {};
    return this.facilityRepository.find({ where, order: { type: 'ASC', name: 'ASC' } });
  }

  async findById(id: string): Promise<Facility> {
    const facility = await this.facilityRepository.findOne({ where: { id } });
    if (!facility) {
      throw new NotFoundException('Facility not found');
    }
    return facility;
  }

  async create(dto: CreateFacilityDto): Promise<Facility> {
    const existing = await this.facilityRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`A facility with code "${dto.code}" already exists.`);
    }
    const facility = this.facilityRepository.create(dto);
    return this.facilityRepository.save(facility);
  }

  async update(id: string, dto: UpdateFacilityDto): Promise<Facility> {
    await this.findById(id);
    await this.facilityRepository.update(id, dto);
    return this.findById(id);
  }

  async remove(id: string): Promise<Facility> {
    // Soft-deactivate rather than hard delete — samples/users reference facilities.
    await this.findById(id);
    await this.facilityRepository.update(id, { isActive: false });
    return this.findById(id);
  }
}
