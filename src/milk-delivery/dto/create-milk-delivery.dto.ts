import {
  IsDateString,
  IsIn,
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';

export class CreateMilkDeliveryDto {
  @IsMongoId()
  @IsNotEmpty()
  customerId: string;

  @IsDateString()
  date: string;

  @IsIn(Array.from({ length: 41 }, (_, index) => index / 4))
  morning: number;

  @IsIn(Array.from({ length: 41 }, (_, index) => index / 4))
  evening: number;
}