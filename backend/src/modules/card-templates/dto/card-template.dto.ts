import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

// The designer always sends the full template on save, so create + update share
// the same shape. `elements` is an opaque list of positioned elements — the
// admin owns its schema, the API just persists it.
export class SaveCardTemplateDto {
  @IsString()
  name: string;

  @IsNumber()
  w: number;

  @IsNumber()
  h: number;

  @IsString()
  bg: string;

  // Optional full-card background image (base64 data-URL) layered behind the
  // solid `bg`, plus how it fits the card ('cover' | 'contain').
  @IsOptional()
  @IsString()
  bgImage?: string;

  @IsOptional()
  @IsString()
  bgFit?: string;

  @IsOptional()
  @IsNumber()
  radius?: number;

  @IsArray()
  elements: any[];
}
