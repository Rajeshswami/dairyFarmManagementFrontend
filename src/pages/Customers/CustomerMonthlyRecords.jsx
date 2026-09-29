import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";

import { getMilkDeliveriesApi } from "../../api/milkDelivery.api";

const FARM_TIMEZONE = "Asia/Kolkata";

const getFarmToday = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FARM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

const formatDate = (date) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const createMonthDays = (year, month) => {
  const days = getDaysInMonth(year, month);

  return Array.from({ length: days }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    const monthValue = String(month).padStart(2, "0");

    return `${year}-${monthValue}-${day}`;
  });
};

const formatLiters = (value) => {
  const number = Number(value || 0);

  if (number === 0) {
    return "-";
  }

  return `${number.toFixed(2)} L`;
};

const formatMonth = (year, month) => {
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

export default function CustomerMonthlyRecords({
  customer,
  onBack,
}) {
  const today = getFarmToday();

  const [initialYear, initialMonth] = today
    .split("-")
    .map(Number);

  const [selectedMonth, setSelectedMonth] = useState({ year: initialYear, month: initialMonth });
  const { year, month } = selectedMonth;

  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMonthlyRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const dates = createMonthDays(year, month);

      /*
       * The existing Milk Delivery API supports filtering
       * by date. We fetch each day of the selected month
       * and keep only this customer's record.
       */
      const requestYear = year;
      const requestMonth = month;
      const responses = await Promise.all(
        dates.map((date) => getMilkDeliveriesApi({ date }))
      );

      if (requestYear !== selectedMonth.year || requestMonth !== selectedMonth.month) return;

      const monthlyRecords = dates.map((date, index) => {
        const response = responses[index];

        const deliveries = Array.isArray(response)
          ? response
          : response?.deliveries || [];

        const deliveriesForDate = deliveries.filter((delivery) => {
          if (!delivery?.date) return true;
          return String(delivery.date).slice(0, 10) === date;
        });

        const customerDelivery = deliveriesForDate.find(
          (delivery) => {
            const deliveryCustomerId =
              delivery.customerId?._id ||
              delivery.customerId ||
              delivery.customer?._id;

            return (
              String(deliveryCustomerId) ===
              String(customer._id)
            );
          }
        );

        return {
          date,
          morning: Number(
            customerDelivery?.morning || 0
          ),
          evening: Number(
            customerDelivery?.evening || 0
          ),
          totalLiters: Number(
            customerDelivery?.totalLiters ||
              (Number(customerDelivery?.morning || 0) +
                Number(customerDelivery?.evening || 0))
          ),
          amount: Number(
            customerDelivery?.amount || 0
          ),
          exists: Boolean(customerDelivery),
        };
      });

      setRecords(monthlyRecords);
    } catch (err) {
      console.error(
        "Customer monthly records error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load monthly milk records."
      );

      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthlyRecords();
  }, [year, month, customer._id]);

  const goPreviousMonth = () => {
    setSelectedMonth((current) =>
      current.month === 1
        ? { year: current.year - 1, month: 12 }
        : { year: current.year, month: current.month - 1 }
    );
  };

  const goNextMonth = () => {
    setSelectedMonth((current) =>
      current.month === 12
        ? { year: current.year + 1, month: 1 }
        : { year: current.year, month: current.month + 1 }
    );
  };

  const summary = useMemo(() => {
    return records.reduce(
      (result, record) => {
        result.morning += Number(
          record.morning || 0
        );

        result.evening += Number(
          record.evening || 0
        );

        result.total += Number(
          record.totalLiters || 0
        );

        return result;
      },
      {
        morning: 0,
        evening: 0,
        total: 0,
      }
    );
  }, [records]);

  const monthlyAmount = useMemo(() => {
    /*
     * Use the customer's current rate as the display rate.
     * Billing itself continues to use the backend bill logic.
     */
    return (
      summary.total *
      Number(customer.ratePerLiter || 0)
    );
  }, [summary.total, customer.ratePerLiter]);

  return (
    <div>
      {/* Header */}
      <div className="page-heading">
        <div>
          <Button
            variant="link"
            className="px-0 mb-2"
            onClick={onBack}
          >
            ← Back to Customers
          </Button>

          <h2 className="mb-1">
            {customer.name}
          </h2>

          <p className="text-muted mb-0">
            Monthly milk delivery records
          </p>
        </div>
      </div>

      {/* Customer information */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <div className="text-muted small">
                Customer
              </div>

              <div className="fw-semibold">
                {customer.name}
              </div>
            </Col>

            <Col md={4}>
              <div className="text-muted small">
                Mobile
              </div>

              <div className="fw-semibold">
                {customer.mobile || "-"}
              </div>
            </Col>

            <Col md={4}>
              <div className="text-muted small">
                Rate
              </div>

              <div className="fw-semibold">
                ₹{Number(
                  customer.ratePerLiter || 0
                )} / L
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Month navigation */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <Button
              variant="outline-primary"
              onClick={goPreviousMonth}
            >
              ← Previous
            </Button>

            <h4 className="mb-0">
              {formatMonth(year, month)}
            </h4>

            <Button
              variant="outline-primary"
              onClick={goNextMonth}
            >
              Next →
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Error */}
      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* Summary */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card>
            <Card.Body>
              <div className="text-muted">
                Morning
              </div>

              <div className="fs-4 fw-bold">
                {formatLiters(summary.morning)}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card>
            <Card.Body>
              <div className="text-muted">
                Evening
              </div>

              <div className="fs-4 fw-bold">
                {formatLiters(summary.evening)}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card>
            <Card.Body>
              <div className="text-muted">
                Total Milk
              </div>

              <div className="fs-4 fw-bold text-success">
                {formatLiters(summary.total)}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card>
            <Card.Body>
              <div className="text-muted">
                Monthly Amount
              </div>

              <div className="fs-4 fw-bold">
                ₹{monthlyAmount.toFixed(2)}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Monthly table */}
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-1">
                Daily Milk Record
              </h5>

              <div className="text-muted small">
                {formatMonth(year, month)}
              </div>
            </div>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={loadMonthlyRecords}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />

              <div className="text-muted mt-2">
                Loading monthly records...
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <Table
                hover
                bordered
                className="align-middle"
              >
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Morning</th>
                    <th>Evening</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr key={record.date}>
                      <td>
                        {formatDate(record.date)}
                      </td>

                      <td>
                        {formatLiters(
                          record.morning
                        )}
                      </td>

                      <td>
                        {formatLiters(
                          record.evening
                        )}
                      </td>

                      <td className="fw-semibold">
                        {formatLiters(
                          record.totalLiters
                        )}
                      </td>
                    </tr>
                  ))}

                  <tr className="table-light">
                    <td>
                      <strong>Total</strong>
                    </td>

                    <td>
                      <strong>
                        {formatLiters(
                          summary.morning
                        )}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {formatLiters(
                          summary.evening
                        )}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {formatLiters(
                          summary.total
                        )}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}