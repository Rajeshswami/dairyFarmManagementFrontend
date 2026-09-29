import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
  Badge,
} from 'react-bootstrap';

import {
  getActiveCustomersApi,
} from '../../api/customers.api';

import {
  getCustomerPaymentsApi,
} from '../../api/payments.api';

import PaymentFormModal from './PaymentFormModal';

function Payments() {
  const [customers, setCustomers] =
    useState([]);

  const [selectedCustomer, setSelectedCustomer] =
    useState('');

  const [data, setData] = useState({
    count: 0,
    totalPaid: 0,
    payments: [],
  });

  const [loadingCustomers, setLoadingCustomers] =
    useState(true);

  const [loadingPayments, setLoadingPayments] =
    useState(false);

  const [error, setError] = useState('');

  const [editPayment, setEditPayment] =
    useState(null);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoadingCustomers(true);

        const result =
          await getActiveCustomersApi();

        setCustomers(
          Array.isArray(result)
            ? result
            : result?.customers || []
        );
      } catch (error) {
        console.error(error);

        setError(
          error?.response?.data?.message ||
            'Failed to load customers.'
        );
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, []);

  const loadPayments = async () => {
    if (!selectedCustomer) {
      setData({
        count: 0,
        totalPaid: 0,
        payments: [],
      });

      return;
    }

    try {
      setLoadingPayments(true);
      setError('');

      const result =
        await getCustomerPaymentsApi(
          selectedCustomer
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
          'Failed to load payments.'
      );
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [selectedCustomer]);

  const selectedCustomerObject =
    customers.find(
      (customer) =>
        customer._id === selectedCustomer
    );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">
            Payments
          </h3>

          <div className="text-muted">
            Manage customer payment history
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger">
          {Array.isArray(error)
            ? error.join(', ')
            : error}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={5}>
              <Form.Group>
                <Form.Label>
                  Customer
                </Form.Label>

                <Form.Select
                  value={selectedCustomer}
                  onChange={(event) =>
                    setSelectedCustomer(
                      event.target.value
                    )
                  }
                  disabled={loadingCustomers}
                >
                  <option value="">
                    Select Customer
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={customer._id}
                        value={customer._id}
                      >
                        {customer.name}
                      </option>
                    )
                  )}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {selectedCustomer && (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card>
                <Card.Body>
                  <div className="text-muted">
                    Total Payments
                  </div>

                  <div className="fs-3 fw-semibold">
                    {data.count}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card>
                <Card.Body>
                  <div className="text-muted">
                    Total Paid
                  </div>

                  <div className="fs-3 fw-semibold text-success">
                    ₹
                    {data.totalPaid.toFixed(
                      2
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  Payment History
                </h5>
              </div>

              {loadingPayments ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : data.payments.length === 0 ? (
                <div className="text-center text-muted py-5">
                  No payments found.
                </div>
              ) : (
                <Table
                  responsive
                  bordered
                  hover
                >
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Bill</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Bill Amount</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.payments.map(
                      (payment) => {
                        const bill =
                          payment.bill;

                        const variant =
                          bill?.status ===
                          'PAID'
                            ? 'success'
                            : bill?.status ===
                              'PARTIAL'
                            ? 'warning'
                            : 'danger';

                        return (
                          <tr
                            key={
                              payment.paymentId
                            }
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
                              {
                                payment.paymentMethod
                              }
                            </td>

                            <td>
                              ₹
                              {Number(
                                bill?.totalAmount ||
                                  0
                              ).toFixed(2)}
                            </td>

                            <td className="text-success">
                              ₹
                              {Number(
                                bill?.paidAmount ||
                                  0
                              ).toFixed(2)}
                            </td>

                            <td className="text-danger">
                              ₹
                              {Number(
                                bill?.pendingAmount ||
                                  0
                              ).toFixed(2)}
                            </td>

                            <td>
                              <Badge bg={variant}>
                                {bill?.status ||
                                  '-'}
                              </Badge>
                            </td>

                            <td>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() =>
                                  setEditPayment(
                                    payment
                                  )
                                }
                              >
                                Edit
                              </Button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {editPayment && (
        <PaymentFormModal
          show
          payment={editPayment}
          onHide={() =>
            setEditPayment(null)
          }
          onSuccess={async () => {
            setEditPayment(null);
            await loadPayments();
          }}
        />
      )}
    </div>
  );
}

export default Payments;