import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsIn(Array.from({ length: 41 }, (_, index) => index / 4))
  morning: number;

  @IsIn(Array.from({ length: 41 }, (_, index) => index / 4))
  evening: number;

  @IsDateString()
  startDate: string;
}