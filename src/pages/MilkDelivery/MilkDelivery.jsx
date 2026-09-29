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
  getMilkDeliveriesApi,
  createMilkDeliveryApi,
  updateMilkDeliveryApi,
  deleteMilkDeliveryApi,
} from "../../api/milkDelivery.api";

import { getActiveCustomersApi } from "../../api/customers.api";

const QUANTITIES = [
  { value: 0, label: "0" },
  { value: 0.25, label: "¼ L" },
  { value: 0.5, label: "½ L" },
  { value: 0.75, label: "¾ L" },
  { value: 1, label: "1 L" },
];

const formatLiters = (value) => `${Number(value || 0).toFixed(2)} L`;

const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeDate = (value) => {
  if (!value) return "";

  return new Date(value).toISOString().split("T")[0];
};

function MilkDelivery() {
  const [date, setDate] = useState(getToday());

  const [customers, setCustomers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);

  /*
   * ---------------------------------------------------------
   * Load customers
   * ---------------------------------------------------------
   */

  const loadCustomers = async () => {
    try {
      const response = await getActiveCustomersApi();

      const data = Array.isArray(response)
        ? response
        : response?.customers || [];

      setCustomers(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load customers.",
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * Load deliveries for selected date
   * ---------------------------------------------------------
   */

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await getMilkDeliveriesApi({
        date,
      });

      const data = Array.isArray(response)
        ? response
        : response?.deliveries || [];

      setDeliveries(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load deliveries.",
      );

      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [date]);

  /*
   * ---------------------------------------------------------
   * Build daily rows
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const deliveryMap = new Map();

    deliveries.forEach((delivery) => {
      const customerId =
        delivery.customerId?._id ||
        delivery.customerId ||
        delivery.customer?._id;

      if (customerId) {
        deliveryMap.set(String(customerId), delivery);
      }
    });

    const nextRows = customers.map((customer) => {
      const customerId = String(customer._id);

      const existing = deliveryMap.get(customerId);

      return {
        customerId,

        customer,

        deliveryId: existing?._id || existing?.id || null,

        morning: Number(existing?.morning || 0),

        evening: Number(existing?.evening || 0),

        existing: Boolean(existing),
      };
    });

    setRows(nextRows);
  }, [customers, deliveries]);

  /*
   * ---------------------------------------------------------
   * Update row quantity
   * ---------------------------------------------------------
   */

  const updateRow = (customerId, field, value) => {
    setRows((current) =>
      current.map((row) => {
        if (row.customerId !== customerId) {
          return row;
        }

        return {
          ...row,
          [field]: Number(value),
        };
      }),
    );
  };

  /*
   * ---------------------------------------------------------
   * Totals
   * ---------------------------------------------------------
   */

  const totalLiters = useMemo(() => {
    return rows.reduce(
      (sum, row) => sum + Number(row.morning || 0) + Number(row.evening || 0),
      0,
    );
  }, [rows]);

  const morningTotal = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.morning || 0), 0);
  }, [rows]);

  const eveningTotal = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.evening || 0), 0);
  }, [rows]);

  /*
   * ---------------------------------------------------------
   * Save one customer's delivery
   * ---------------------------------------------------------
   */

  const saveRow = async (row) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setEditingId(row.customerId);

      const morning = Number(row.morning || 0);
      const evening = Number(row.evening || 0);

      /*
       * Nothing selected.
       *
       * If an existing delivery is present and both
       * quantities become zero, delete it instead.
       */

      if (morning === 0 && evening === 0) {
        if (row.deliveryId) {
          await deleteMilkDeliveryApi(row.deliveryId);
        }

        await loadDeliveries();

        setSuccess(`${row.customer.name} delivery cleared.`);

        return;
      }

      const payload = {
        customerId: row.customerId,
        date,
        morning,
        evening,
      };

      if (row.deliveryId) {
        await updateMilkDeliveryApi(row.deliveryId, payload);

        setSuccess(`${row.customer.name} delivery updated.`);
      } else {
        await createMilkDeliveryApi(payload);

        setSuccess(`${row.customer.name} delivery recorded.`);
      }

      await loadDeliveries();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save delivery.",
      );
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * Save all changed rows
   * ---------------------------------------------------------
   */

  const saveAll = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let saved = 0;

      for (const row of rows) {
        const morning = Number(row.morning || 0);
        const evening = Number(row.evening || 0);

        if (morning === 0 && evening === 0 && !row.deliveryId) {
          continue;
        }

        const payload = {
          customerId: row.customerId,
          date,
          morning,
          evening,
        };

        if (row.deliveryId) {
          await updateMilkDeliveryApi(row.deliveryId, payload);
        } else {
          await createMilkDeliveryApi(payload);
        }

        saved++;
      }

      await loadDeliveries();

      setSuccess(`${saved} delivery record(s) saved successfully.`);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save deliveries.",
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * Delete delivery
   * ---------------------------------------------------------
   */

  const deleteDelivery = async (row) => {
    if (!row.deliveryId) return;

    const confirmed = window.confirm(
      `Delete delivery for ${row.customer.name} on ${date}?`,
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await deleteMilkDeliveryApi(row.deliveryId);

      await loadDeliveries();

      setSuccess(`${row.customer.name} delivery deleted.`);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete delivery.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid">
      {/* Header */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Milk Delivery</h2>

          <div className="text-muted">Record daily customer milk delivery</div>
        </div>
      </div>

      {/* Messages */}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Date */}

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="align-items-end g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Delivery Date</Form.Label>

                <Form.Control
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md="auto">
              <Button
                variant="outline-primary"
                onClick={loadDeliveries}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" animation="border" /> : "Refresh"}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Summary */}

      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="text-muted">Morning</div>

              <div className="fs-4 fw-bold">{formatLiters(morningTotal)}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="text-muted">Evening</div>

              <div className="fs-4 fw-bold">{formatLiters(eveningTotal)}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="text-muted">Total Delivery</div>

              <div className="fs-4 fw-bold text-success">
                {formatLiters(totalLiters)}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delivery Table */}

      <Card className="shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-1">Customer Delivery</h5>

              <div className="text-muted small">{date}</div>
            </div>

            <Button
              variant="primary"
              onClick={saveAll}
              disabled={saving || rows.length === 0}
            >
              {saving ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Saving...
                </>
              ) : (
                "Save All"
              )}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />

              <div className="text-muted mt-2">Loading deliveries...</div>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center text-muted py-5">
              No active customers found.
            </div>
          ) : (
            <Table responsive hover bordered className="align-middle">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th style={{ width: 180 }}>Morning</th>
                  <th style={{ width: 180 }}>Evening</th>
                  <th style={{ width: 220 }}>Action</th>
                  <th style={{ width: 140 }}>Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.customerId}>
                    {/* Customer */}

                    <td>
                      <strong>{row.customer.name}</strong>
                    </td>

                    {/* Morning */}

                    <td>
                      <Form.Select
                        value={row.morning}
                        onChange={(e) =>
                          updateRow(row.customerId, "morning", e.target.value)
                        }
                      >
                        {QUANTITIES.map((quantity) => (
                          <option key={quantity.value} value={quantity.value}>
                            {quantity.label}
                          </option>
                        ))}
                      </Form.Select>
                    </td>

                    {/* Evening */}

                    <td>
                      <Form.Select
                        value={row.evening}
                        onChange={(e) =>
                          updateRow(row.customerId, "evening", e.target.value)
                        }
                      >
                        {QUANTITIES.map((quantity) => (
                          <option key={quantity.value} value={quantity.value}>
                            {quantity.label}
                          </option>
                        ))}
                      </Form.Select>
                    </td>

                    {/* Action */}

                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant={row.existing ? "outline-primary" : "primary"}
                          onClick={() => saveRow(row)}
                          disabled={saving && editingId === row.customerId}
                        >
                          {saving && editingId === row.customerId ? (
                            <Spinner size="sm" animation="border" />
                          ) : row.existing ? (
                            "Update"
                          ) : (
                            "Save"
                          )}
                        </Button>

                        {row.existing && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => deleteDelivery(row)}
                            disabled={saving}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>

                    {/* Status */}

                    <td>
                      {row.existing ? (
                        <Badge bg="success">Recorded</Badge>
                      ) : (
                        <Badge bg="secondary">Pending</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default MilkDelivery;
