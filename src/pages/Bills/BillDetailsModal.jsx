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
            बिल का विवरण / Bill Details
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="mb-3">
            <Col>
              <small className="text-muted">
                ग्राहक / Customer
              </small>

              <div className="fw-semibold">
                {bill.customer?.name ||
                  'Unknown ग्राहक / Customer'}
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
                बिल का महीना
              </small>

              <div>
                {bill.month}/{bill.year}
              </div>
            </Col>

            <Col>
              <small className="text-muted">
                दूध
              </small>

              <div>
                {Number(
                  bill.totalLiters || 0
                ).toFixed(2)}{' '}
                L
              </div>
            </Col>
          </Row>

          {Number(bill.creditAmount || 0) > 0 && (
            <div className="credit-notice mb-3">
              ग्राहक / ग्राहक क्रेडिट: <strong>₹{Number(bill.creditAmount).toFixed(2)}</strong>. This is an overpayment retained in the payment history.
            </div>
          )}

          <hr />

          <Row>
            <Col>
              <small className="text-muted">
                कुल राशि
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
                जमा
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
                बाकी
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
            भुगतान इतिहास
          </Button>

          {pending > 0 && (
            <Button
              variant="success"
              onClick={() =>
                setCollecting(true)
              }
            >
              भुगतान लें
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={onHide}
          >
            बंद करें
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