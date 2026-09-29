import { useState } from 'react';
import {
  Badge,
  Button,
  Col,
  Modal,
  Row,
} from 'react-bootstrap';

import PaymentFormModal from '../Payments/PaymentFormModal';
import PaymentHistoryModal from '../Payments/PaymentHistoryModal';

function BillDetailsModal({
  show,
  onHide,
  bill,
  onPaymentSuccess,
}) {
  const [collecting, setCollecting] =
    useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  if (!bill) return null;

  const pending = Number(
    bill.pendingAmount || 0
  );

  const statusVariant =
    bill.status === 'PAID'
      ? 'success'
      : bill.status === 'PARTIAL'
      ? 'warning'
      : 'danger';

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Bill Details
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="mb-3">
            <Col>
              <small className="text-muted">
                Customer
              </small>

              <div className="fw-semibold">
                {bill.customer?.name ||
                  'Unknown Customer'}
              </div>

              {bill.customer?.mobile && (
                <small className="text-muted">
                  {bill.customer.mobile}
                </small>
              )}
            </Col>

            <Col xs="auto">
              <Badge bg={statusVariant}>
                {bill.status}
              </Badge>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <small className="text-muted">
                Billing Period
              </small>

              <div>
                {bill.month}/{bill.year}
              </div>
            </Col>

            <Col>
              <small className="text-muted">
                Milk
              </small>

              <div>
                {Number(
                  bill.totalLiters || 0
                ).toFixed(2)}{' '}
                L
              </div>
            </Col>
          </Row>

          <hr />

          <Row>
            <Col>
              <small className="text-muted">
                Total
              </small>

              <div className="fw-semibold">
                ₹
                {Number(
                  bill.totalAmount || 0
                ).toFixed(2)}
              </div>
            </Col>

            <Col>
              <small className="text-muted">
                Paid
              </small>

              <div className="fw-semibold text-success">
                ₹
                {Number(
                  bill.paidAmount || 0
                ).toFixed(2)}
              </div>
            </Col>

            <Col>
              <small className="text-muted">
                Pending
              </small>

              <div className="fw-semibold text-danger">
                ₹{pending.toFixed(2)}
              </div>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() =>
              setShowHistory(true)
            }
          >
            Payment History
          </Button>

          {pending > 0 && (
            <Button
              variant="success"
              onClick={() =>
                setCollecting(true)
              }
            >
              Collect Payment
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={onHide}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <PaymentFormModal
        show={collecting}
        onHide={() => setCollecting(false)}
        bill={bill}
        onSuccess={() => {
          setCollecting(false);
          onPaymentSuccess?.();
        }}
      />

      <PaymentHistoryModal
        show={showHistory}
        onHide={() => setShowHistory(false)}
        customer={{
          _id: bill.customer?._id,
          name: bill.customer?.name,
        }}
        onChanged={() => {
          onPaymentSuccess?.();
        }}
      />
    </>
  );
}

export default BillDetailsModal;