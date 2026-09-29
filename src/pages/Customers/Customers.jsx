import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";

import {
  activateCustomerApi,
  createCustomerApi,
  deactivateCustomerApi,
  getCustomersApi,
  updateCustomerApi,
} from "../../api/customers.api";

import {
  getMilkDeliveriesApi,
} from "../../api/milkDelivery.api";

import CustomerForm from "./CustomerForm";

import { useAuth } from "../../context/AuthContext";

const FARM_TIMEZONE = "Asia/Kolkata";

const getFarmToday = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FARM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

const formatLiters = (value) => {
  const quantity = Number(value || 0);

  if (quantity === 0) {
    return "-";
  }

  return `${quantity.toFixed(2)} L`;
};

const formatQuantity = (value) => {
  const quantity = Number(value || 0);

  if (quantity === 0) {
    return "-";
  }

  return `${quantity} L`;
};

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const createMonthDays = (year, month) => {
  const daysInMonth = getDaysInMonth(year, month);

  return Array.from(
    { length: daysInMonth },
    (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const monthValue = String(month).padStart(2, "0");

      return `${year}-${monthValue}-${day}`;
    }
  );
};

const formatDisplayDate = (dateString) => {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatMonth = (year, month) => {
  return new Date(
    year,
    month - 1,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

export default function Customers() {
  const { user } = useAuth();

  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [formLoading, setFormLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState(null);

  // Selected customer for monthly records
  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  // ---------------------------------------------------------
  // Monthly customer milk records
  // ---------------------------------------------------------

  const today = getFarmToday();

  const [initialYear, initialMonth] = today
    .split("-")
    .map(Number);

  const [recordDate, setRecordDate] = useState({
    year: initialYear,
    month: initialMonth,
  });

  const { year: recordYear, month: recordMonth } = recordDate;

  const [monthlyRecords, setMonthlyRecords] =
    useState([]);

  const [monthlyLoading, setMonthlyLoading] =
    useState(false);

  const [monthlyError, setMonthlyError] =
    useState("");

  // ---------------------------------------------------------
  // Load customers
  // ---------------------------------------------------------

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomersApi();

      setCustomers(
        Array.isArray(data)
          ? data
          : data.customers || []
      );
    } catch (error) {
      console.error(
        "Customers error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // ---------------------------------------------------------
  // Filter customers
  // ---------------------------------------------------------

  const filteredCustomers = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.name
          ?.toLowerCase()
          .includes(value) ||
        customer.mobile
          ?.toLowerCase()
          .includes(value) ||
        customer.address
          ?.toLowerCase()
          .includes(value)
    );
  }, [customers, search]);

  // ---------------------------------------------------------
  // Permissions
  // ---------------------------------------------------------

  const canManage =
    user?.role === "ADMIN" ||
    user?.role === "MANAGER";

  // ---------------------------------------------------------
  // Customer actions
  // ---------------------------------------------------------

  const handleAdd = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    setFormLoading(true);

    try {
      if (editingCustomer) {
        await updateCustomerApi(
          editingCustomer._id,
          data
        );
      } else {
        await createCustomerApi(data);
      }

      await loadCustomers();

      setShowForm(false);
      setEditingCustomer(null);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to save customer"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (
    customer
  ) => {
    try {
      setError("");

      if (customer.active) {
        await deactivateCustomerApi(
          customer._id
        );
      } else {
        await activateCustomerApi(
          customer._id
        );
      }

      await loadCustomers();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to update customer status"
      );
    }
  };

  // ---------------------------------------------------------
  // Open monthly customer records
  // ---------------------------------------------------------

  const handleViewRecords = (customer) => {
    setSelectedCustomer(customer);

    const currentDate = getFarmToday();

    const [year, month] = currentDate
      .split("-")
      .map(Number);

    setRecordDate({ year, month });

    setMonthlyRecords([]);
    setMonthlyError("");
  };

  // ---------------------------------------------------------
  // Load selected customer's monthly records
  // ---------------------------------------------------------

  const loadMonthlyRecords = async () => {
    if (!selectedCustomer?._id) {
      return;
    }

    try {
      setMonthlyLoading(true);
      setMonthlyError("");

      const requestYear = recordYear;
      const requestMonth = recordMonth;
      const dates = createMonthDays(requestYear, requestMonth);

      /*
       * The existing Milk Delivery API supports
       * fetching deliveries by date.
       *
       * We fetch each day of the selected month
       * and select the delivery belonging to the
       * selected customer.
       */

      const responses = await Promise.all(
        dates.map((date) => getMilkDeliveriesApi({ date }))
      );

      if (requestYear !== recordDate.year || requestMonth !== recordDate.month) return;

      const records = dates.map(
        (date, index) => {
          const response = responses[index];

          const deliveries = Array.isArray(response)
            ? response
            : response?.deliveries || [];

          const deliveriesForDate = deliveries.filter((delivery) => {
            if (!delivery?.date) return true;
            return String(delivery.date).slice(0, 10) === date;
          });

          const customerDelivery =
            deliveriesForDate.find((delivery) => {
              const deliveryCustomerId =
                delivery.customerId?._id ||
                delivery.customerId ||
                delivery.customer?._id;

              return (
                String(deliveryCustomerId) ===
                String(selectedCustomer._id)
              );
            });

          const morning = Number(
            customerDelivery?.morning || 0
          );

          const evening = Number(
            customerDelivery?.evening || 0
          );

          const totalLiters = Number(
            customerDelivery?.totalLiters ||
              morning + evening
          );

          const amount = Number(
            customerDelivery?.amount || 0
          );

          return {
            date,
            morning,
            evening,
            totalLiters,
            amount,
            exists:
              Boolean(customerDelivery),
          };
        }
      );

      setMonthlyRecords(records);
    } catch (error) {
      console.error(
        "Customer monthly records error:",
        error
      );

      setMonthlyError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load monthly milk records."
      );

      setMonthlyRecords([]);
    } finally {
      setMonthlyLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCustomer) {
      return;
    }

    loadMonthlyRecords();
  }, [
    selectedCustomer,
    recordYear,
    recordMonth,
  ]);

  // ---------------------------------------------------------
  // Previous month
  // ---------------------------------------------------------

  const handlePreviousMonth = () => {
    setRecordDate((current) =>
      current.month === 1
        ? { year: current.year - 1, month: 12 }
        : { year: current.year, month: current.month - 1 }
    );
  };

  const handleNextMonth = () => {
    setRecordDate((current) =>
      current.month === 12
        ? { year: current.year + 1, month: 1 }
        : { year: current.year, month: current.month + 1 }
    );
  };

  // ---------------------------------------------------------
  // Monthly totals
  // ---------------------------------------------------------

  const monthlySummary = useMemo(() => {
    return monthlyRecords.reduce(
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
  }, [monthlyRecords]);

  // ---------------------------------------------------------
  // Monthly amount
  // ---------------------------------------------------------

  const monthlyAmount = useMemo(() => {
    if (!selectedCustomer) {
      return 0;
    }

    return (
      monthlySummary.total *
      Number(
        selectedCustomer.ratePerLiter || 0
      )
    );
  }, [
    monthlySummary.total,
    selectedCustomer,
  ]);

  // ---------------------------------------------------------
  // Monthly records screen
  // ---------------------------------------------------------

  if (selectedCustomer) {
    return (
      <div>
        {/* Header */}
        <div className="page-heading">
          <div>
            <Button
              variant="link"
              className="px-0 mb-2"
              onClick={() => {
                setSelectedCustomer(null);
                setMonthlyRecords([]);
                setMonthlyError("");
              }}
            >
              ← Back to Customers
            </Button>

            <h2 className="mb-1">
              {selectedCustomer.name}
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
                  {selectedCustomer.name}
                </div>
              </Col>

              <Col md={4}>
                <div className="text-muted small">
                  Mobile
                </div>

                <div className="fw-semibold">
                  {selectedCustomer.mobile ||
                    "-"}
                </div>
              </Col>

              <Col md={4}>
                <div className="text-muted small">
                  Rate
                </div>

                <div className="fw-semibold">
                  ₹
                  {Number(
                    selectedCustomer.ratePerLiter ||
                      0
                  )}{" "}
                  / L
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
                onClick={
                  handlePreviousMonth
                }
              >
                ← Previous
              </Button>

              <h4 className="mb-0">
                {formatMonth(
                  recordYear,
                  recordMonth
                )}
              </h4>

              <Button
                variant="outline-primary"
                onClick={handleNextMonth}
              >
                Next →
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Error */}
        {monthlyError && (
          <Alert
            variant="danger"
            dismissible
            onClose={() =>
              setMonthlyError("")
            }
          >
            {monthlyError}
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
                  {formatLiters(
                    monthlySummary.morning
                  )}
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
                  {formatLiters(
                    monthlySummary.evening
                  )}
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
                  {formatLiters(
                    monthlySummary.total
                  )}
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

        {/* Daily records */}
        <Card>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-1">
                  Daily Milk Record
                </h5>

                <div className="text-muted small">
                  {formatMonth(
                    recordYear,
                    recordMonth
                  )}
                </div>
              </div>

              <Button
                variant="outline-secondary"
                size="sm"
                onClick={
                  loadMonthlyRecords
                }
                disabled={monthlyLoading}
              >
                {monthlyLoading ? (
                  <Spinner
                    size="sm"
                    animation="border"
                  />
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>

            {monthlyLoading ? (
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
                    {monthlyRecords.map(
                      (record) => (
                        <tr
                          key={record.date}
                          className={
                            !record.exists
                              ? "text-muted"
                              : ""
                          }
                        >
                          <td>
                            {formatDisplayDate(
                              record.date
                            )}
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
                      )
                    )}

                    <tr className="table-light">
                      <td>
                        <strong>
                          Total
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {formatLiters(
                            monthlySummary.morning
                          )}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {formatLiters(
                            monthlySummary.evening
                          )}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {formatLiters(
                            monthlySummary.total
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

  // ---------------------------------------------------------
  // Customers screen
  // ---------------------------------------------------------

  return (
    <div>
      {/* Heading */}
      <div className="page-heading">
        <div>
          <h2>
            Customers
          </h2>

          <p className="text-muted mb-0">
            Manage milk customers and
            delivery schedules
          </p>
        </div>

        {canManage && (
          <Button onClick={handleAdd}>
            + Add Customer
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() =>
            setError("")
          }
        >
          {Array.isArray(error)
            ? error.join(", ")
            : error}
        </Alert>
      )}

      {/* Customer table */}
      <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={5}>
              <Form.Control
                placeholder="Search by name, mobile or address..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </Col>

            <Col
              md={7}
              className="text-md-end mt-2 mt-md-0"
            >
              <span className="text-muted">
                Showing{" "}
                <strong>
                  {
                    filteredCustomers.length
                  }
                </strong>{" "}
                of{" "}
                <strong>
                  {customers.length}
                </strong>{" "}
                customers
              </span>
            </Col>
          </Row>

          {loading ? (
            <div className="page-loading">
              <Spinner animation="border" />

              <span>
                Loading customers...
              </span>
            </div>
          ) : filteredCustomers.length ===
            0 ? (
            <div className="text-center py-5">
              <h5>
                No customers found
              </h5>

              <p className="text-muted">
                {search
                  ? "Try a different search."
                  : "Add your first customer to get started."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table
                hover
                responsive
                className="align-middle"
              >
                <thead>
                  <tr>
                    <th>
                      Customer
                    </th>

                    <th>
                      Mobile
                    </th>

                    <th>
                      Morning
                    </th>

                    <th>
                      Evening
                    </th>

                    <th>
                      Rate
                    </th>

                    <th>
                      Status
                    </th>

                    {canManage && (
                      <th className="text-end">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map(
                    (customer) => (
                      <tr
                        key={customer._id}
                      >
                        {/* Customer */}

                        <td>
                          <button
                            type="button"
                            className="btn btn-link p-0 text-decoration-none fw-semibold"
                            onClick={() =>
                              handleViewRecords(
                                customer
                              )
                            }
                          >
                            {customer.name}
                          </button>

                          {customer.address && (
                            <div>
                              <small className="text-muted">
                                {
                                  customer.address
                                }
                              </small>
                            </div>
                          )}
                        </td>

                        {/* Mobile */}

                        <td>
                          {customer.mobile}
                        </td>

                        {/* Morning */}

                        <td>
                          {formatQuantity(
                            customer.morning
                          )}
                        </td>

                        {/* Evening */}

                        <td>
                          {formatQuantity(
                            customer.evening
                          )}
                        </td>

                        {/* Rate */}

                        <td>
                          ₹
                          {Number(
                            customer.ratePerLiter ||
                              0
                          )}
                        </td>

                        {/* Status */}

                        <td>
                          {customer.active ? (
                            <Badge bg="success">
                              Active
                            </Badge>
                          ) : (
                            <Badge bg="secondary">
                              Inactive
                            </Badge>
                          )}
                        </td>

                        {/* Actions */}

                        {canManage && (
                          <td className="text-end">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="me-2"
                              onClick={() =>
                                handleViewRecords(
                                  customer
                                )
                              }
                            >
                              View
                            </Button>

                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() =>
                                handleEdit(
                                  customer
                                )
                              }
                            >
                              Edit
                            </Button>

                            <Button
                              variant={
                                customer.active
                                  ? "outline-danger"
                                  : "outline-success"
                              }
                              size="sm"
                              onClick={() =>
                                handleToggleStatus(
                                  customer
                                )
                              }
                            >
                              {customer.active
                                ? "Deactivate"
                                : "Activate"}
                            </Button>
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Customer form */}

      <CustomerForm
        show={showForm}
        onHide={() => {
          setShowForm(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleSubmit}
        customer={editingCustomer}
        loading={formLoading}
      />
    </div>
  );
}