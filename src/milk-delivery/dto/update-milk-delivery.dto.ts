import {
  IsDateString,
  IsIn,
  IsOptional,
} from 'class-validator';

export class UpdateMilkDeliveryDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsIn(Array.from({ length: 41 }, (_, index) => index / 4))
  @IsOptional()
  morning?: number;

  @IsIn(Array.from({ length: 41 }, (_, index) => index / 4))
  @IsOptional()
  evening?: number;
}