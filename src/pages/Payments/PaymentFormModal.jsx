import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Col,
  Form,
  Modal,
  Row,
} from 'react-bootstrap';

import {
  createPaymentApi,
  updatePaymentApi,
} from '../../api/payments.api';

const METHODS = ['CASH', 'UPI', 'BANK'];

const today = () =>
  new Date().toISOString().split('T')[0];

function PaymentFormModal({
  show,
  onHide,
  bill,
  payment,
  onSuccess,
}) {
  const editing = Boolean(payment);

  const [form, setForm] = useState({
    amount: '',
    paymentDate: today(),
    paymentMethod: 'CASH',
    note: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) return;

    if (payment) {
      setForm({
        amount: payment.amount ?? '',
        paymentDate: payment.paymentDate
          ? new Date(payment.paymentDate)
              .toISOString()
              .split('T')[0]
          : today(),
        paymentMethod:
          payment.paymentMethod || 'CASH',
        note: payment.note || '',
      });
    } else {
      setForm({
        amount: bill?.pendingAmount || '',
        paymentDate: today(),
        paymentMethod: 'CASH',
        note: '',
      });
    }

    setError('');
  }, [show, bill, payment]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    setError('');

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      setError('Enter a valid payment amount.');
      return;
    }

    if (!editing && amount > Number(bill.pendingAmount)) {
      setError(
        `Payment cannot exceed pending amount ₹${Number(
          bill.pendingAmount
        ).toFixed(2)}.`
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        amount,
        paymentDate: form.paymentDate,
        paymentMethod: form.paymentMethod,
        note: form.note.trim() || undefined,
      };

      if (editing) {
        await updatePaymentApi(
          payment.paymentId,
          payload
        );
      } else {
        await createPaymentApi({
          ...payload,
          customerId: bill.customer._id,
          billId: bill.billId,
        });
      }

      onSuccess?.();
      onHide();
    } catch (error) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to save payment.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
    >
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editing
              ? 'Edit Payment'
              : 'Collect Payment'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && (
            <Alert variant="danger">
              {Array.isArray(error)
                ? error.join(', ')
                : error}
            </Alert>
          )}

          {bill && !editing && (
            <div className="bg-light rounded p-3 mb-3">
              <Row>
                <Col>
                  <small className="text-muted">
                    Total
                  </small>
                  <div className="fw-semibold">
                    ₹{Number(bill.totalAmount).toFixed(2)}
                  </div>
                </Col>

                <Col>
                  <small className="text-muted">
                    Paid
                  </small>
                  <div className="text-success fw-semibold">
                    ₹{Number(bill.paidAmount).toFixed(2)}
                  </div>
                </Col>

                <Col>
                  <small className="text-muted">
                    Pending
                  </small>
                  <div className="text-danger fw-semibold">
                    ₹{Number(bill.pendingAmount).toFixed(2)}
                  </div>
                </Col>
              </Row>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Amount *</Form.Label>

            <Form.Control
              type="number"
              min="0.01"
              step="0.01"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Payment Date *</Form.Label>

            <Form.Control
              type="date"
              name="paymentDate"
              value={form.paymentDate}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Payment Method *</Form.Label>

            <Form.Select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
            >
              {METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Note</Form.Label>

            <Form.Control
              as="textarea"
              rows={3}
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="Optional note"
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={onHide}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="success"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : editing
              ? 'Update Payment'
              : 'Collect Payment'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default PaymentFormModal;