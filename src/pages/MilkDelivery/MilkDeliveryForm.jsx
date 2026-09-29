import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
} from 'react-bootstrap';

const initialForm = {
  customerId: '',
  date: '',
  morning: '',
  evening: '',
};

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function quantityLabel(value) {
  const amount = Number(value || 0);

  if (amount === 0) return 'No milk';
  if (amount === 0.25) return '¼ L';
  if (amount === 0.5) return '½ L';
  if (amount === 0.75) return '¾ L';
  if (amount === 1) return '1 L';

  return `${amount} L`;
}

export default function MilkDeliveryForm({
  show,
  onHide,
  onSubmit,
  delivery,
  customers,
  loading = false,
}) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (delivery) {
      setForm({
        customerId:
          delivery.customerId?._id ||
          delivery.customerId ||
          '',

        date: formatDate(delivery.date),

        morning:
          delivery.morning !== undefined
            ? delivery.morning
            : '',

        evening:
          delivery.evening !== undefined
            ? delivery.evening
            : '',
      });
    } else {
      setForm(initialForm);
    }
  }, [delivery, show]);

  const selectedCustomer = useMemo(() => {
    return customers.find(
      (customer) =>
        customer._id === form.customerId,
    );
  }, [customers, form.customerId]);

  const totalLiters = useMemo(() => {
    return (
      Number(form.morning || 0) +
      Number(form.evening || 0)
    );
  }, [form.morning, form.evening]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCustomerChange = (event) => {
    const customerId = event.target.value;

    const customer = customers.find(
      (item) => item._id === customerId,
    );

    setForm((previous) => ({
      ...previous,
      customerId,

      // For a new delivery, use customer's
      // configured schedule as the default.
      ...(customer && !delivery
        ? {
            morning: customer.morning ?? 0,
            evening: customer.evening ?? 0,
          }
        : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      customerId: form.customerId,
      date: form.date,
      morning: Number(form.morning || 0),
      evening: Number(form.evening || 0),
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
    >
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {delivery
              ? 'Edit Milk Delivery'
              : 'Record Milk Delivery'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="g-3">

            {/* Customer */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Customer *
                </Form.Label>

                <Form.Select
                  value={form.customerId}
                  onChange={handleCustomerChange}
                  required
                >
                  <option value="">
                    Select customer
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer._id}
                      value={customer._id}
                    >
                      {customer.name} - {customer.mobile}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Date */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Delivery Date *
                </Form.Label>

                <Form.Control
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>

            {/* Customer schedule */}
            {selectedCustomer && (
              <Col md={12}>
                <Card className="bg-light border-0">
                  <Card.Body className="py-2">
                    <div className="small text-muted">
                      Customer's regular schedule
                    </div>

                    <strong>
                      Morning:{' '}
                      {quantityLabel(
                        selectedCustomer.morning,
                      )}
                      {' | '}
                      Evening:{' '}
                      {quantityLabel(
                        selectedCustomer.evening,
                      )}
                    </strong>
                  </Card.Body>
                </Card>
              </Col>
            )}

            {/* Morning */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Morning Delivery
                </Form.Label>

                <Form.Select
                  name="morning"
                  value={form.morning}
                  onChange={handleChange}
                >
                  <option value="0">
                    No milk
                  </option>

                  <option value="0.25">
                    ¼ L
                  </option>

                  <option value="0.5">
                    ½ L
                  </option>

                  <option value="0.75">
                    ¾ L
                  </option>

                  <option value="1">
                    1 L
                  </option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Evening */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Evening Delivery
                </Form.Label>

                <Form.Select
                  name="evening"
                  value={form.evening}
                  onChange={handleChange}
                >
                  <option value="0">
                    No milk
                  </option>

                  <option value="0.25">
                    ¼ L
                  </option>

                  <option value="0.5">
                    ½ L
                  </option>

                  <option value="0.75">
                    ¾ L
                  </option>

                  <option value="1">
                    1 L
                  </option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Total */}
            <Col md={12}>
              <div className="p-3 bg-light rounded">
                <div className="text-muted small">
                  Total Delivered
                </div>

                <div className="fs-3 fw-bold">
                  {totalLiters.toFixed(2)} L
                </div>
              </div>
            </Col>

          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={onHide}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            type="submit"
            disabled={
              loading || totalLiters <= 0
            }
          >
            {loading
              ? 'Saving...'
              : delivery
                ? 'Update Delivery'
                : 'Record Delivery'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}