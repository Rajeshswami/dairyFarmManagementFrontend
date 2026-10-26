import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsIn(Array.from({ length: 41 }, (_, index) => index / 4))
  @IsOptional()
  morning?: number;

  @IsIn(Array.from({ length: 41 }, (_, index) => index / 4))
  @IsOptional()
  evening?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ratePerLiter?: number;
}