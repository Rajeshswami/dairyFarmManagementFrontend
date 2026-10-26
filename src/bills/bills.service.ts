import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  startOfFarmMonth,
  startOfNextFarmMonth,
} from '../common/utils/farm-date.util';

import {
  MilkDelivery,
  MilkDeliveryDocument,
} from '../milk-delivery/schema/milk-delivery.schema';

import {
  MonthlyBill,
  MonthlyBillDocument,
} from './schema/monthly-bill.schema';

import { CreateMonthlyBillDto } from './dto/create-monthly-bill.dto';
import { Customer, CustomerDocument } from '../customers/schema/customer.schema';

@Injectable()
export class BillsService {
  constructor(
    @InjectModel(MonthlyBill.name)
    private readonly billModel: Model<MonthlyBillDocument>,

    @InjectModel(MilkDelivery.name)
    private readonly milkDeliveryModel: Model<MilkDeliveryDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
  ) {}

  // =========================================================
  // GENERATE / REGENERATE MONTHLY BILL
  // =========================================================

  async generateMonthlyBill(
    dto: CreateMonthlyBillDto,
  ) {
    const { customerId, year, month } = dto;

    // -------------------------------------------------------
    // Validate customer ID
    // -------------------------------------------------------

    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException(
        'Invalid customer ID',
      );
    }

    // -------------------------------------------------------
    // Validate year
    // -------------------------------------------------------

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      throw new BadRequestException(
        'Invalid year',
      );
    }

    // -------------------------------------------------------
    // Validate month
    // -------------------------------------------------------

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      throw new BadRequestException(
        'Invalid month',
      );
    }

    // -------------------------------------------------------
    // Get farm month boundaries
    //
    // IMPORTANT:
    // These are based on FARM_TIMEZONE,
    // not the server timezone.
    // -------------------------------------------------------

    const startDate = startOfFarmMonth(
      year,
      month,
    );

    const endDate = startOfNextFarmMonth(
      year,
      month,
    );

    // -------------------------------------------------------
    // Get actual milk deliveries
    // -------------------------------------------------------

    const deliveries =
      await this.milkDeliveryModel.find({
        customerId: new Types.ObjectId(customerId),

        date: {
          $gte: startDate,
          $lt: endDate,
        },
      });

    // -------------------------------------------------------
    // No deliveries = no bill
    // -------------------------------------------------------

    if (deliveries.length === 0) {
      throw new NotFoundException(
        'No milk deliveries found for this customer in the selected month',
      );
    }

    // -------------------------------------------------------
    // Calculate total milk
    //
    // IMPORTANT:
    // Billing is based on ACTUAL DELIVERY,
    // not customer's configured morning/evening quantity.
    // -------------------------------------------------------

    const totalLiters = deliveries.reduce(
      (sum, delivery) =>
        sum + Number(delivery.totalLiters || 0),
      0,
    );

    // -------------------------------------------------------
    // Calculate amount from each delivery's rate
    //
    // This is important if the rate changes during a month.
    //
    // Example:
    // 10L × ₹75
    // 10L × ₹80
    //
    // We calculate each delivery separately.
    // -------------------------------------------------------

    const totalAmount = deliveries.reduce(
      (sum, delivery) =>
        sum +
        Number(delivery.totalLiters || 0) *
          Number(delivery.ratePerLiter || 0),
      0,
    );

    // -------------------------------------------------------
    // Validate calculated values
    // -------------------------------------------------------

    if (totalLiters <= 0) {
      throw new BadRequestException(
        'Total milk quantity must be greater than zero',
      );
    }

    if (totalAmount <= 0) {
      throw new BadRequestException(
        'Total bill amount must be greater than zero',
      );
    }

    // -------------------------------------------------------
    // Find existing bill
    //
    // If the bill already exists, this operation becomes
    // a REGENERATION rather than creating a second bill.
    // -------------------------------------------------------

    const existingBill =
      await this.billModel.findOne({
        customerId: new Types.ObjectId(customerId),
        year,
        month,
      });

    // -------------------------------------------------------
    // Preserve existing payments
    // -------------------------------------------------------

    const paidAmount = existingBill
      ? Number(existingBill.paidAmount || 0)
      : 0;

    // Keep every recorded payment. If a historical correction
    // makes the bill smaller than payments already received,
    // show the difference as a customer credit instead of
    // blocking the delivery correction or deleting payment history.
    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    const creditAmount = Math.max(0, paidAmount - totalAmount);

    // -------------------------------------------------------
    // Calculate bill status
    // -------------------------------------------------------

    let status:
      | 'PENDING'
      | 'PARTIAL'
      | 'PAID';

    if (pendingAmount === 0 && paidAmount > 0) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    } else {
      status = 'PENDING';
    }

    // -------------------------------------------------------
    // Calculate average rate
    //
    // This is only a reference/display value.
    //
    // totalAmount is the authoritative billing value
    // because each delivery can have its own rate.
    // -------------------------------------------------------

    // Weighted effective rate: total billed amount / total litres.
    const averageRate = totalLiters > 0 ? totalAmount / totalLiters : 0;

    // -------------------------------------------------------
    // Create or update bill
    // -------------------------------------------------------

    if (existingBill) {
      existingBill.totalLiters =
        totalLiters;

      existingBill.ratePerLiter =
        averageRate;

      existingBill.totalAmount =
        totalAmount;

      existingBill.paidAmount =
        paidAmount;

      existingBill.pendingAmount =
        pendingAmount;

      existingBill.creditAmount = creditAmount;

      existingBill.status =
        status;

      return existingBill.save();
    }

    // -------------------------------------------------------
    // Create new bill
    // -------------------------------------------------------

    const bill =
      new this.billModel({
        customerId:
          new Types.ObjectId(customerId),

        year,

        month,

        totalLiters,

        ratePerLiter:
          averageRate,

        totalAmount,

        paidAmount: 0,

        pendingAmount:
          totalAmount,

        creditAmount: 0,

        status: 'PENDING',
      });

    return bill.save();
  }

  // =========================================================
  // GET MONTHLY BILL SUMMARY
  // =========================================================

  async getMonthlySummary(year: number, month: number) {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('Invalid year');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('Invalid month');
    }

    const startDate = startOfFarmMonth(year, month);
    const endDate = startOfNextFarmMonth(year, month);

    const [bills, deliveries] = await Promise.all([
      this.billModel.find({ year, month }).populate('customerId', 'name mobile address ratePerLiter active').exec(),
      this.milkDeliveryModel.find({ date: { $gte: startDate, $lt: endDate } }).exec(),
    ]);

    const billByCustomer = new Map<string, any>();
    for (const bill of bills) {
      const customerRef: any = bill.customerId;
      const id = String(customerRef?._id || bill.customerId);
      billByCustomer.set(id, bill);
    }

    const deliveriesByCustomer = new Map<string, { liters: number; amount: number; rateLiters: number; rateAmount: number }>();
    for (const delivery of deliveries) {
      const id = String(delivery.customerId);
      const current = deliveriesByCustomer.get(id) || { liters: 0, amount: 0, rateLiters: 0, rateAmount: 0 };
      const liters = Number(delivery.totalLiters || 0);
      const amount = liters * Number(delivery.ratePerLiter || 0);
      current.liters += liters;
      current.amount += amount;
      current.rateLiters += liters;
      current.rateAmount += amount;
      deliveriesByCustomer.set(id, current);
    }

    const customerIds = new Set<string>([
      ...billByCustomer.keys(),
      ...deliveriesByCustomer.keys(),
    ]);
    const customers = customerIds.size
      ? await this.customerModel.find({ _id: { $in: [...customerIds].map((id) => new Types.ObjectId(id)) } }).exec()
      : [];
    const customerById = new Map(customers.map((customer) => [customer._id.toString(), customer]));

    const rows = [...customerIds].map((customerId) => {
      const bill: any = billByCustomer.get(customerId);
      const delivery = deliveriesByCustomer.get(customerId) || { liters: 0, amount: 0, rateLiters: 0, rateAmount: 0 };
      const customer: any = customerById.get(customerId) || (bill?.customerId?._id ? bill.customerId : null);
      const billGenerated = Boolean(bill);
      const totalLiters = billGenerated ? Number(bill.totalLiters || 0) : delivery.liters;
      const totalAmount = billGenerated ? Number(bill.totalAmount || 0) : delivery.amount;
      const paidAmount = billGenerated ? Number(bill.paidAmount || 0) : 0;
      const pendingAmount = billGenerated ? Number(bill.pendingAmount || 0) : delivery.amount;
      const averageRate = delivery.liters > 0 ? delivery.amount / delivery.liters : Number(customer?.ratePerLiter || 0);

      return {
        billId: bill?._id || null,
        billGenerated,
        customer: customer ? { _id: customer._id, name: customer.name, mobile: customer.mobile, address: customer.address } : null,
        totalLiters,
        ratePerLiter: bill?.ratePerLiter ?? averageRate,
        totalAmount,
        estimatedAmount: billGenerated ? null : delivery.amount,
        paidAmount,
        pendingAmount,
        creditAmount: Number(bill?.creditAmount || 0),
        status: bill?.status || 'NOT_GENERATED',
      };
    }).filter((row) => row.customer);

    const summary = rows.reduce((result, row) => {
      result.totalCustomers += 1;
      result.totalMilkLiters += Number(row.totalLiters || 0);
      result.totalBilling += Number(row.totalAmount || 0);
      result.totalCollected += Number(row.paidAmount || 0);
      result.totalPending += Number(row.pendingAmount || 0);
      if (!row.billGenerated) {
        result.unbilledCustomers += 1;
        result.totalUnbilledAmount += Number(row.estimatedAmount || 0);
      }
      result.totalCredit += Number(row.creditAmount || 0);
      return result;
    }, {
      totalCustomers: 0,
      totalMilkLiters: 0,
      totalBilling: 0,
      totalCollected: 0,
      totalPending: 0,
      unbilledCustomers: 0,
      totalUnbilledAmount: 0,
      totalCredit: 0,
    });

    return { year, month, summary, customers: rows };
  }

  // =========================================================
  // GET PENDING BILLS
  // =========================================================

  async getPendingBills(
    year: number,
    month: number,
  ) {
    // -------------------------------------------------------
    // Validate year
    // -------------------------------------------------------

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      throw new BadRequestException(
        'Invalid year',
      );
    }

    // -------------------------------------------------------
    // Validate month
    // -------------------------------------------------------

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      throw new BadRequestException(
        'Invalid month',
      );
    }

    // -------------------------------------------------------
    // Get pending/partial bills
    // -------------------------------------------------------

    const bills =
      await this.billModel
        .find({
          year,
          month,

          status: {
            $in: [
              'PENDING',
              'PARTIAL',
            ],
          },

          pendingAmount: {
            $gt: 0,
          },
        })
        .populate(
          'customerId',
          'name mobile address',
        )
        .sort({
          pendingAmount: -1,
        });

    // -------------------------------------------------------
    // Calculate total pending
    // -------------------------------------------------------

    const totalPending =
      bills.reduce(
        (sum, bill) =>
          sum +
          Number(
            bill.pendingAmount || 0,
          ),
        0,
      );

    return {
      count: bills.length,

      totalPending,

      bills: bills.map(
        (bill) => ({
          billId: bill._id,

          customer: bill.customerId,

          year: bill.year,

          month: bill.month,

          totalLiters:
            bill.totalLiters,

          totalAmount:
            bill.totalAmount,

          paidAmount:
            bill.paidAmount,

          pendingAmount:
            bill.pendingAmount,

          status:
            bill.status,
        }),
      ),
    };
  }

  // =========================================================
  // GET SINGLE BILL
  // =========================================================

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Invalid bill ID',
      );
    }

    const bill =
      await this.billModel
        .findById(id)
        .populate(
          'customerId',
          'name mobile address ratePerLiter active',
        );

    if (!bill) {
      throw new NotFoundException(
        'Bill not found',
      );
    }

    return bill;
  }

  // =========================================================
  // GET CUSTOMER BILLS
  // =========================================================

  async findCustomerBills(
    customerId: string,
  ) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException(
        'Invalid customer ID',
      );
    }

    return this.billModel
      .find({
        customerId:
          new Types.ObjectId(customerId),
      })
      .sort({
        year: -1,
        month: -1,
      });
  }
}