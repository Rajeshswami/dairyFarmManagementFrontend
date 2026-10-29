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
  const label = value === 0 ? (localStorage.getItem('dairy-app-language') === 'hi' ? 'दूध नहीं' : 'No milk') : `${Number(value.toFixed(2))} L`;
  return { value, label };
});

export default function CustomerForm({
  show,
  onHide,
  onSubmit,
  customer,
  loading,
}) {
  const [form, setForm] = useState(initialForm);
  const [language, setLanguage] = useState(() => localStorage.getItem("dairy-app-language") || "hi");
  const isHindi = language === "hi";

  useEffect(() => {
    const syncLanguage = (event) => setLanguage(event.detail || localStorage.getItem("dairy-app-language") || "hi");
    window.addEventListener("dairy-language-change", syncLanguage);
    return () => window.removeEventListener("dairy-language-change", syncLanguage);
  }, []);

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
      setError(isHindi ? 'ग्राहक का नाम लिखें।' : 'Customer name is required');
      return;
    }

    if (!form.mobile.trim()) {
      setError(isHindi ? 'मोबाइल नंबर लिखें।' : 'Mobile number is required');
      return;
    }

    if (!form.startDate) {
      setError(isHindi ? 'शुरू करने की तारीख चुनें।' : 'Start date is required');
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
        (isHindi ? 'ग्राहक की जानकारी सेव नहीं हुई।' : 'Failed to save customer');

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
              ? (isHindi ? 'ग्राहक की जानकारी बदलें' : 'Edit customer')
              : (isHindi ? 'नया ग्राहक जोड़ें' : 'Add customer')}
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
              {isHindi ? "ग्राहक का नाम" : "Customer Name"}
            </Form.Label>

            <Form.Control
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={isHindi ? "ग्राहक का नाम लिखें" : "Enter customer name"}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              {isHindi ? "मोबाइल नंबर" : "Mobile Number"}
            </Form.Label>

            <Form.Control
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder={isHindi ? "मोबाइल नंबर लिखें" : "Enter mobile number"}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              {isHindi ? "पता" : "Address"}
            </Form.Label>

            <Form.Control
              as="textarea"
              rows={2}
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder={isHindi ? "पता लिखें" : "Enter address"}
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  {isHindi ? "सुबह का दूध" : "Morning Milk"}
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
                  {isHindi ? "शाम का दूध" : "Evening Milk"}
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
              {isHindi ? "शुरू करने की तारीख" : "Start Date"}
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
            <Form.Label>{isHindi ? "दूध का भाव (₹ प्रति लीटर)" : "Milk rate (₹ per litre)"}</Form.Label>
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
            {isHindi ? "रद्द करें" : "Cancel"}
          </Button>

          <Button
            type="submit"
            disabled={loading}
          >
            {loading
              ? (isHindi ? 'सेव हो रहा है…' : 'Saving…')
              : isEditing
              ? (isHindi ? 'जानकारी सेव करें' : 'Update customer')
              : (isHindi ? 'नया ग्राहक जोड़ें' : 'Add customer')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}