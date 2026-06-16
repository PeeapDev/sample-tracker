import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardTemplate } from '../../database/entities/card-template.entity';
import { SaveCardTemplateDto } from './dto/card-template.dto';

// Flatten the stored entity into the shape the designer works with:
// { id, name, w, h, bg, radius, elements, updatedAt }.
function toDto(t: CardTemplate) {
  const layout = t.layout ?? ({} as CardTemplate['layout']);
  const { w, h, bg, radius, elements } = layout;
  return {
    id: t.id,
    name: t.name,
    w,
    h,
    bg,
    bgImage: layout.bgImage ?? null,
    bgFit: layout.bgFit ?? 'cover',
    radius: radius ?? 0,
    elements: elements ?? [],
    updatedAt: t.updatedAt,
  };
}

// Build the stored jsonb layout from an incoming save payload.
function toLayout(dto: SaveCardTemplateDto): CardTemplate['layout'] {
  return {
    w: dto.w,
    h: dto.h,
    bg: dto.bg,
    radius: dto.radius ?? 0,
    elements: dto.elements ?? [],
    ...(dto.bgImage ? { bgImage: dto.bgImage } : {}),
    bgFit: dto.bgFit ?? 'cover',
  };
}

@Injectable()
export class CardTemplatesService {
  constructor(
    @InjectRepository(CardTemplate)
    private readonly repo: Repository<CardTemplate>,
  ) {}

  async findAll() {
    const rows = await this.repo.find({ order: { updatedAt: 'DESC' } });
    return rows.map(toDto);
  }

  async create(dto: SaveCardTemplateDto, userId?: string) {
    const entity = this.repo.create({
      name: dto.name,
      layout: toLayout(dto),
      createdBy: userId,
    });
    return toDto(await this.repo.save(entity));
  }

  async update(id: string, dto: SaveCardTemplateDto) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Card template not found');
    entity.name = dto.name;
    entity.layout = toLayout(dto);
    return toDto(await this.repo.save(entity));
  }

  async remove(id: string) {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('Card template not found');
    return { message: 'Card template deleted' };
  }
}
