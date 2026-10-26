import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import {
  Customer,
  CustomerDocument,
} from '../customers/schema/customer.schema';

import {
  MilkDelivery,
  MilkDeliveryDocument,
} from './schema/milk-delivery.schema';

import { CreateMilkDeliveryDto } from './dto/create-milk-delivery.dto';
import { UpdateMilkDeliveryDto } from './dto/update-milk-delivery.dto';
import { startOfFarmDate, startOfNextFarmDate, startOfFarmMonth, startOfNextFarmMonth, toFarmDateString } from '../common/utils/farm-date.util';
import { MonthlyBill, MonthlyBillDocument } from '../bills/schema/monthly-bill.schema';
import { Payment, PaymentDocument } from '../payments/schema/payment.schema';

@Injectable()
export class MilkDeliveryService {
  constructor(
    @InjectModel(MilkDelivery.name)
    private readonly milkDeliveryModel:
      Model<MilkDeliveryDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel:
      Model<CustomerDocument>,

    @InjectModel(MonthlyBill.name)
    private readonly billModel: Model<MonthlyBillDocument>,

    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async create(
    dto: CreateMilkDeliveryDto,
  ) {
    const customer =
      await this.customerModel.findById(
        dto.customerId,
      );

    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    if (!customer.active) {
      throw new BadRequestException(
        'Customer is inactive',
      );
    }

    const totalLiters =
      dto.morning + dto.evening;

    const ratePerLiter =
      customer.ratePerLiter;

    const amount =
      totalLiters * ratePerLiter;

    const delivery =
      new this.milkDeliveryModel({
        customerId: customer._id,

        date: startOfFarmDate(dto.date),

        morning: dto.morning,

        evening: dto.evening,

        totalLiters,

        ratePerLiter,

        amount,
      });

    const saved = await delivery.save();
    await this.recalculateExistingBillForDate(customer._id.toString(), saved.date);
    return saved;
  }

  async findAll(filters: { date?: string; customerId?: string } = {}) {
    const query: Record<string, any> = {};

    if (filters.date) {
      const start = startOfFarmDate(filters.date);
      const end = startOfNextFarmDate(filters.date);
      query.date = { $gte: start, $lt: end };
    }

    if (filters.customerId) {
      if (!/^[a-f\d]{24}$/i.test(filters.customerId)) {
        throw new BadRequestException('Invalid customer ID');
      }
      query.customerId = filters.customerId;
    }

    return this.milkDeliveryModel
      .find(query)
      .populate('customerId', 'name mobile ratePerLiter')
      .sort({ date: -1, createdAt: -1 })
      .exec();
  }
  async findOne(id: string) {
  const delivery = await this.milkDeliveryModel
    .findById(id)
    .populate(
      'customerId',
      'name mobile address ratePerLiter active',
    );

  if (!delivery) {
    throw new NotFoundException(
      'Milk delivery record not found',
    );
  }

  return delivery;
}
async update(
  id: string,
  dto: UpdateMilkDeliveryDto,
) {
  const delivery = await this.milkDeliveryModel.findById(id);

  if (!delivery) {
    throw new NotFoundException(
      'Milk delivery record not found',
    );
  }

  const originalDate = new Date(delivery.date);
  const customerId = delivery.customerId.toString();

  // -----------------------------
  // Update date
  // -----------------------------
 if (dto.date !== undefined) {
  delivery.date = startOfFarmDate(dto.date);
}

  // -----------------------------
  // Update quantities
  // -----------------------------
  if (dto.morning !== undefined) {
    delivery.morning = dto.morning;
  }

  if (dto.evening !== undefined) {
    delivery.evening = dto.evening;
  }

  // -----------------------------
  // Recalculate totals
  // -----------------------------
  delivery.totalLiters =
    delivery.morning + delivery.evening;

  delivery.amount =
    delivery.totalLiters * delivery.ratePerLiter;

  const saved = await delivery.save();
  await this.recalculateExistingBillForDate(customerId, originalDate);
  if (originalDate.getTime() !== saved.date.getTime()) {
    await this.recalculateExistingBillForDate(customerId, saved.date);
  }
  return saved;
}
async remove(id: string) {
  const delivery =
    await this.milkDeliveryModel.findByIdAndDelete(id);

  if (!delivery) {
    throw new NotFoundException(
      'Milk delivery record not found',
    );
  }

  await this.recalculateExistingBillForDate(
    delivery.customerId.toString(),
    delivery.date,
  );

  return {
    message: 'Milk delivery record deleted successfully',
  };
}

private async recalculateExistingBillForDate(customerId: string, date: Date) {
  const farmDate = toFarmDateString(date);
  const year = Number(farmDate.slice(0, 4));
  const month = Number(farmDate.slice(5, 7));
  const start = startOfFarmMonth(year, month);
  const end = startOfNextFarmMonth(year, month);

  const bill = await this.billModel.findOne({
    customerId: new Types.ObjectId(customerId),
    year,
    month,
  });

  // Do not automatically create a bill: users explicitly generate it.
  // If it exists, keep it synchronized with corrected deliveries.
  if (!bill) return;

  const deliveries = await this.milkDeliveryModel.find({
    customerId: new Types.ObjectId(customerId),
    date: { $gte: start, $lt: end },
  });

  const totalLiters = deliveries.reduce(
    (sum, item) => sum + Number(item.totalLiters || 0), 0,
  );
  const totalAmount = deliveries.reduce(
    (sum, item) => sum + Number(item.totalLiters || 0) * Number(item.ratePerLiter || 0), 0,
  );
  const payments = await this.paymentModel.find({ billId: bill._id });
  const paidAmount = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const creditAmount = Math.max(0, paidAmount - totalAmount);
  const averageRate = totalLiters > 0 ? totalAmount / totalLiters : 0;

  bill.totalLiters = totalLiters;
  bill.totalAmount = totalAmount;
  bill.ratePerLiter = averageRate;
  bill.paidAmount = paidAmount;
  bill.pendingAmount = pendingAmount;
  bill.creditAmount = creditAmount;
  bill.status = pendingAmount === 0 && paidAmount > 0
    ? 'PAID'
    : paidAmount > 0
      ? 'PARTIAL'
      : 'PENDING';
  await bill.save();
}
}