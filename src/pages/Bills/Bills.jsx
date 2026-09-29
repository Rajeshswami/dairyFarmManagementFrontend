import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Spinner,
  Table,
} from 'react-bootstrap';

import { useAuth } from '../../context/AuthContext';

import {
  getActiveCustomersApi,
} from '../../api/customers.api';

import {
  generateMonthlyBillApi,
  getMonthlyBillsApi,
} from '../../api/bills.api';

import BillGenerateModal from './BillGenerateModal';
import BillDetailsModal from './BillDetailsModal';
import {
  getFarmYear,
  getFarmMonth,
} from "../../utils/farmDate";
export default function Bills() {
  const { user } = useAuth();

  const today = new Date();

const [year, setYear] =
  useState(getFarmYear());

const [month, setMonth] =
  useState(getFarmMonth());

  const [customers, setCustomers] =
    useState([]);

  const [bills, setBills] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] =
    useState('');

  const [showGenerate, setShowGenerate] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [selectedBill, setSelectedBill] =
    useState(null);

  const canManage =
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER';

  // ---------------------------------------
  // Load customers
  // ---------------------------------------

  const loadCustomers = async () => {
    try {
      const result =
        await getActiveCustomersApi();

      if (Array.isArray(result)) {
        setCustomers(result);
      } else if (
        Array.isArray(result?.customers)
      ) {
        setCustomers(result.customers);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          'Failed to load customers.'
      );
    }
  };

  // ---------------------------------------
  // Load monthly bills
  // ---------------------------------------

  const loadBills = async () => {
    try {
      setLoading(true);
      setError('');

      const result =
        await getMonthlyBillsApi(
          year,
          month
        );

      /*
       * Actual backend response:
       *
       * {
       *   year: 2026,
       *   month: 9,
       *   summary: {...},
       *   customers: [...]
       * }
       */

      if (Array.isArray(result)) {
        setBills(result);
      } else if (
        Array.isArray(result?.customers)
      ) {
        setBills(result.customers);
      } else if (
        Array.isArray(result?.bills)
      ) {
        setBills(result.bills);
      } else if (
        Array.isArray(result?.data)
      ) {
        setBills(result.data);
      } else {
        setBills([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          'Failed to load monthly bills.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------
  // Initial load
  // ---------------------------------------

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadBills();
  }, [year, month]);

  // ---------------------------------------
  // Summary
  // ---------------------------------------

  const summary = useMemo(() => {
    return bills.reduce(
      (result, bill) => {
        result.totalLiters +=
          Number(
            bill.totalLiters
          ) || 0;

        result.totalBilling +=
          Number(
            bill.totalAmount
          ) || 0;

        result.totalCollected +=
          Number(
            bill.paidAmount
          ) || 0;

        result.totalPending +=
          Number(
            bill.pendingAmount
          ) || 0;

        if (bill.status === 'PAID') {
          result.paidCustomers += 1;
        }

        if (bill.status === 'PARTIAL') {
          result.partialCustomers += 1;
        }

        if (bill.status === 'PENDING') {
          result.pendingCustomers += 1;
        }

        return result;
      },
      {
        totalLiters: 0,
        totalBilling: 0,
        totalCollected: 0,
        totalPending: 0,
        paidCustomers: 0,
        partialCustomers: 0,
        pendingCustomers: 0,
      }
    );
  }, [bills]);

  // ---------------------------------------
  // Generate bill
  // ---------------------------------------

  const handleGenerate = async (
    customerId
  ) => {
    try {
      setGenerating(true);
      setError('');

      await generateMonthlyBillApi(
        customerId,
        year,
        month
      );

      setShowGenerate(false);

      await loadBills();
    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(', ')
          : message ||
            'Failed to generate bill.'
      );
    } finally {
      setGenerating(false);
    }
  };

  // ---------------------------------------
  // View bill
  // ---------------------------------------

  const handleView = (bill) => {
    setSelectedBill(bill);
    setShowDetails(true);
  };

  // ---------------------------------------
  // Clear filters
  // ---------------------------------------

const clearFilters = () => {
  setYear(getFarmYear());
  setMonth(getFarmMonth());
};

  return (
    <div>

      {/* Header */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            Monthly Billing
          </h2>

          <p className="text-muted mb-0">
            Generate and manage customer
            monthly bills.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            onClick={() =>
              setShowGenerate(true)
            }
          >
            + Generate Bill
          </Button>
        )}
      </div>

      {/* Error */}

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() =>
            setError('')
          }
        >
          {Array.isArray(error)
            ? error.join(', ')
            : error}
        </Alert>
      )}

      {/* Period filter */}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>

          <div className="row g-3 align-items-end">

            <div className="col-md-4">
              <Form.Group>
                <Form.Label>
                  Year
                </Form.Label>

                <Form.Select
                  value={year}
                  onChange={(event) =>
                    setYear(
                      Number(
                        event.target.value
                      )
                    )
                  }
                >
                  {getYears().map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-4">
              <Form.Group>
                <Form.Label>
                  Month
                </Form.Label>

                <Form.Select
                  value={month}
                  onChange={(event) =>
                    setMonth(
                      Number(
                        event.target.value
                      )
                    )
                  }
                >
                  {Array.from(
                    { length: 12 },
                    (_, index) => (
                      <option
                        key={index + 1}
                        value={index + 1}
                      >
                        {monthName(
                          index + 1
                        )}
                      </option>
                    )
                  )}
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-4">
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={clearFilters}
              >
                Current Month
              </Button>
            </div>

          </div>

        </Card.Body>
      </Card>

      {/* Selected period */}

      <div className="mb-3">
        <h5>
          {monthName(month)} {year}
        </h5>
      </div>

      {/* Summary */}

      <div className="row g-3 mb-4">

        <SummaryCard
          title="Total Billing"
          value={`₹${formatMoney(
            summary.totalBilling
          )}`}
        />

        <SummaryCard
          title="Collected"
          value={`₹${formatMoney(
            summary.totalCollected
          )}`}
          valueClass="text-success"
        />

        <SummaryCard
          title="Pending"
          value={`₹${formatMoney(
            summary.totalPending
          )}`}
          valueClass="text-danger"
        />

        <SummaryCard
          title="Milk Delivered"
          value={`${summary.totalLiters.toFixed(
            2
          )} L`}
        />

      </div>

      {/* Customer status summary */}

      <div className="row g-3 mb-4">

        <div className="col-md-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">
                Paid Customers
              </div>

              <div className="fs-3 fw-bold text-success">
                {summary.paidCustomers}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">
                Partial Payments
              </div>

              <div className="fs-3 fw-bold text-warning">
                {summary.partialCustomers}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">
                Pending Customers
              </div>

              <div className="fs-3 fw-bold text-danger">
                {summary.pendingCustomers}
              </div>
            </Card.Body>
          </Card>
        </div>

      </div>

      {/* Bills table */}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">

          {loading ? (
            <div className="text-center py-5">

              <Spinner animation="border" />

              <div className="text-muted mt-2">
                Loading bills...
              </div>

            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-5">

              <div className="text-muted mb-3">
                No bills generated for{' '}
                {monthName(month)} {year}.
              </div>

              {canManage && (
                <Button
                  variant="primary"
                  onClick={() =>
                    setShowGenerate(true)
                  }
                >
                  Generate First Bill
                </Button>
              )}

            </div>
          ) : (
            <div className="table-responsive">

              <Table
                hover
                className="mb-0 align-middle"
              >

                <thead className="table-light">
                  <tr>
                    <th>Customer</th>
                    <th>Mobile</th>
                    <th>Milk</th>
                    <th>Bill</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {bills.map((bill) => {

                    const customer =
                      bill.customer;

                    return (
                      <tr
                        key={bill.billId}
                      >

                        <td>
                          <strong>
                            {customer?.name ||
                              'Unknown'}
                          </strong>
                        </td>

                        <td>
                          {customer?.mobile ||
                            '-'}
                        </td>

                        <td>
                          {Number(
                            bill.totalLiters ||
                              0
                          ).toFixed(2)}{' '}
                          L
                        </td>

                        <td>
                          <strong>
                            ₹
                            {formatMoney(
                              bill.totalAmount
                            )}
                          </strong>
                        </td>

                        <td className="text-success">
                          ₹
                          {formatMoney(
                            bill.paidAmount
                          )}
                        </td>

                        <td className="text-danger">
                          <strong>
                            ₹
                            {formatMoney(
                              bill.pendingAmount
                            )}
                          </strong>
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              bill.status
                            }
                          />
                        </td>

                        <td>
                          <div className="d-flex justify-content-end">

                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() =>
                                handleView(
                                  bill
                                )
                              }
                            >
                              View
                            </Button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

              </Table>

            </div>
          )}

        </Card.Body>
      </Card>

      {/* Generate modal */}

      <BillGenerateModal
        show={showGenerate}
        onHide={() =>
          setShowGenerate(false)
        }
        onSubmit={handleGenerate}
        customers={customers}
        year={year}
        month={month}
        loading={generating}
      />

      {/* Details modal */}

      <BillDetailsModal
        show={showDetails}
        onHide={() =>
          setShowDetails(false)
        }
        bill={selectedBill}
        onPaymentSuccess={async () => {
          await loadBills();

          /*
           * Refresh selected bill too,
           * so the open modal reflects
           * the latest payment state.
           */
          const refreshed =
            await getMonthlyBillsApi(
              year,
              month
            );

          const refreshedBills =
            Array.isArray(
              refreshed?.customers
            )
              ? refreshed.customers
              : [];

          const updatedBill =
            refreshedBills.find(
              (item) =>
                item.billId ===
                selectedBill?.billId
            );

          if (updatedBill) {
            setSelectedBill(
              updatedBill
            );
          }
        }}
      />

    </div>
  );
}

/* -------------------------------- Helpers */

function SummaryCard({
  title,
  value,
  valueClass = '',
}) {
  return (
    <div className="col-md-3">
      <Card className="border-0 shadow-sm h-100">
        <Card.Body>

          <div className="text-muted small">
            {title}
          </div>

          <div
            className={`fs-4 fw-bold ${valueClass}`}
          >
            {value}
          </div>

        </Card.Body>
      </Card>
    </div>
  );
}

function StatusBadge({ status }) {
  const variant =
    status === 'PAID'
      ? 'success'
      : status === 'PARTIAL'
      ? 'warning'
      : 'danger';

  return (
    <Badge bg={variant}>
      {status}
    </Badge>
  );
}

function formatMoney(value) {
  return Number(
    value || 0
  ).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function monthName(month) {
  return new Date(
    2000,
    Number(month) - 1,
    1
  ).toLocaleString('en-IN', {
    month: 'long',
  });
}

function getYears() {
  const currentYear =
    new Date().getFullYear();

  return Array.from(
    { length: 5 },
    (_, index) =>
      currentYear - 2 + index
  );
}