import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Form,
  Modal,
} from 'react-bootstrap';

export default function BillGenerateModal({
  show,
  onHide,
  onSubmit,
  customers,
  year,
  month,
  loading = false,
}) {
  const [customerId, setCustomerId] = useState('');

  useEffect(() => {
    if (!show) {
      setCustomerId('');
    }
  }, [show]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!customerId) {
      return;
    }

    await onSubmit(customerId);
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
            मासिक बिल बनाएँ / Generate Monthly Bill
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>

          <Alert variant="info">
            The bill will be calculated from the
            customer's actual milk delivery records
            for the selected month.
          </Alert>

          <Form.Group className="mb-3">
            <Form.Label>
              ग्राहक चुनें / Customer *
            </Form.Label>

            <Form.Select
              value={customerId}
              onChange={(event) =>
                setCustomerId(
                  event.target.value,
                )
              }
              required
            >
              <option value="">
                ग्राहक चुनें / Select customer
              </option>

              {customers.map((customer) => (
                <option
                  key={customer._id}
                  value={customer._id}
                >
                  {customer.name} -{' '}
                  {customer.mobile}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <div className="p-3 bg-light rounded">
            <div className="small text-muted">
              बिल का महीना / Billing Period
            </div>

            <strong>
              {monthName(month)} {year}
            </strong>
          </div>

        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={onHide}
            disabled={loading}
          >
            रद्द करें / Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={
              loading || !customerId
            }
          >
            {loading
              ? 'बिल बन रहा है…'
              : 'बिल बनाएँ / Generate Bill'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

function monthName(month) {
  return new Date(
    2000,
    Number(month) - 1,
    1,
  ).toLocaleString('en-IN', {
    month: 'long',
  });
}