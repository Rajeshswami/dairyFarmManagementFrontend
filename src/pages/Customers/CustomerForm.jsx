import { useEffect, useState } from 'react';
import { getFarmToday } from '../../utils/farmDate';
import { getDefaultMilkRateApi } from '../../api/customers.api';
import {
  Alert,
  Button,
  Col,
  Form,
  Modal,
  Row,
} from 'react-bootstrap';

const initialForm = {
  name: '',
  mobile: '',
  address: '',
  morning: 0,
  evening: 0,
  startDate: '',
  ratePerLiter: 75,
};

const quantityOptions = Array.from({ length: 41 }, (_, index) => {
  const value = index * 0.25;
  const label = value === 0 ? 'No milk' : `${Number(value.toFixed(2))} L`;
  return { value, label };
});

export default function CustomerForm({
  show,
  onHide,
  onSubmit,
  customer,
  loading,
}) {
  const [form, setForm] =
    useState(initialForm);

  const [error, setError] = useState('');

  const isEditing = Boolean(customer);

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '',
        mobile: customer.mobile || '',
        address: customer.address || '',
        morning: customer.morning ?? 0,
        evening: customer.evening ?? 0,
        startDate: customer.startDate
          ? customer.startDate.slice(0, 10)
          : '',
        ratePerLiter: customer.ratePerLiter ?? 75,
      });
    } else {
      setForm({
        ...initialForm,
        startDate: getFarmToday(),
        ratePerLiter: 75,
      });
      if (show) {
        getDefaultMilkRateApi()
          .then((result) => {
            if (Number.isFinite(Number(result?.ratePerLiter))) {
              setForm((previous) => ({ ...previous, ratePerLiter: Number(result.ratePerLiter) }));
            }
          })
          .catch(() => {});
      }
    }

    setError('');
  }, [customer, show]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === 'morning' ||
        name === 'evening' ||
        name === 'ratePerLiter'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    if (!form.name.trim()) {
      setError('Customer name is required');
      return;
    }

    if (!form.mobile.trim()) {
      setError('Mobile number is required');
      return;
    }

    if (!form.startDate) {
      setError('Start date is required');
      return;
    }

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        address: form.address.trim(),
      });

      onHide();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to save customer';

      setError(
        Array.isArray(message)
          ? message.join(', ')
          : message
      );
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
    >
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing
              ? 'Edit Customer'
              : 'Add Customer'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && (
            <Alert variant="danger">
              {error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>
              Customer Name
            </Form.Label>

            <Form.Control
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter customer name"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Mobile Number
            </Form.Label>

            <Form.Control
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="Enter mobile number"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Address
            </Form.Label>

            <Form.Control
              as="textarea"
              rows={2}
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter address"
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Morning Milk
                </Form.Label>

                <Form.Select
                  name="morning"
                  value={form.morning}
                  onChange={handleChange}
                >
                  {quantityOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Evening Milk
                </Form.Label>

                <Form.Select
                  name="evening"
                  value={form.evening}
                  onChange={handleChange}
                >
                  {quantityOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group>
            <Form.Label>
              Start Date
            </Form.Label>

            <Form.Control
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mt-3">
            <Form.Label>Milk rate (₹ per litre)</Form.Label>
            <Form.Control
              type="number"
              name="ratePerLiter"
              min="0.01"
              step="0.01"
              value={form.ratePerLiter}
              onChange={handleChange}
              required
            />
            <Form.Text className="text-muted">Rate changes apply to new deliveries. Past deliveries retain their saved rate.</Form.Text>
          </Form.Group>
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
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Saving...'
              : isEditing
              ? 'Update Customer'
              : 'Add Customer'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}