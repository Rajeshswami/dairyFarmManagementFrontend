import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Modal,
  Spinner,
  Table,
} from 'react-bootstrap';

import {
  deletePaymentApi,
  getCustomerPaymentsApi,
} from '../../api/payments.api';

import PaymentFormModal from './PaymentFormModal';

function PaymentHistoryModal({
  show,
  onHide,
  customer,
  onChanged,
}) {
  const [data, setData] = useState({
    count: 0,
    totalPaid: 0,
    payments: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingPayment, setEditingPayment] =
    useState(null);

  const loadPayments = async () => {
    if (!customer?._id) return;

    try {
      setLoading(true);
      setError('');

      const result =
        await getCustomerPaymentsApi(
          customer._id
        );

      setData({
        count: Number(result?.count || 0),
        totalPaid: Number(
          result?.totalPaid || 0
        ),
        payments: Array.isArray(result?.payments)
          ? result.payments
          : [],
      });
    } catch (error) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          'Failed to load payment history.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      loadPayments();
    }
  }, [show, customer?._id]);

  const deletePayment = async (payment) => {
    const confirmed = window.confirm(
      `Delete payment of ₹${Number(
        payment.amount
      ).toFixed(2)}?`
    );

    if (!confirmed) return;

    try {
      await deletePaymentApi(
        payment.paymentId
      );

      await loadPayments();

      onChanged?.();
    } catch (error) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          'Failed to delete payment.'
      );
    }
  };

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Payment History
            {customer?.name
              ? ` - ${customer.name}`
              : ''}
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

          <div className="d-flex gap-4 mb-3">
            <div>
              <small className="text-muted">
                Payments
              </small>

              <div className="fs-5 fw-semibold">
                {data.count}
              </div>
            </div>

            <div>
              <small className="text-muted">
                Total Paid
              </small>

              <div className="fs-5 fw-semibold text-success">
                ₹{data.totalPaid.toFixed(2)}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : data.payments.length === 0 ? (
            <div className="text-center text-muted py-4">
              No payments found.
            </div>
          ) : (
            <Table
              responsive
              bordered
              hover
              size="sm"
            >
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Bill Total</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {data.payments.map((payment) => {
                  const bill = payment.bill;

                  const variant =
                    bill?.status === 'PAID'
                      ? 'success'
                      : bill?.status === 'PARTIAL'
                      ? 'warning'
                      : 'danger';

                  return (
                    <tr
                      key={payment.paymentId}
                    >
                      <td>
                        {new Date(
                          payment.paymentDate
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        {bill
                          ? `${bill.month}/${bill.year}`
                          : '-'}
                      </td>

                      <td className="fw-semibold">
                        ₹
                        {Number(
                          payment.amount
                        ).toFixed(2)}
                      </td>

                      <td>
                        {payment.paymentMethod}
                      </td>

                      <td>
                        ₹
                        {Number(
                          bill?.totalAmount || 0
                        ).toFixed(2)}
                      </td>

                      <td className="text-success">
                        ₹
                        {Number(
                          bill?.paidAmount || 0
                        ).toFixed(2)}
                      </td>

                      <td className="text-danger">
                        ₹
                        {Number(
                          bill?.pendingAmount || 0
                        ).toFixed(2)}
                      </td>

                      <td>
                        <Badge bg={variant}>
                          {bill?.status || '-'}
                        </Badge>
                      </td>

                      <td className="text-nowrap">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="me-2"
                          onClick={() =>
                            setEditingPayment(
                              payment
                            )
                          }
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() =>
                            deletePayment(
                              payment
                            )
                          }
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>

      {editingPayment && (
        <PaymentFormModal
          show
          payment={editingPayment}
          onHide={() =>
            setEditingPayment(null)
          }
          onSuccess={async () => {
            setEditingPayment(null);
            await loadPayments();
            onChanged?.();
          }}
        />
      )}
    </>
  );
}

export default PaymentHistoryModal;