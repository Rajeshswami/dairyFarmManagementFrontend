import { useEffect, useMemo, useState } from 'react';

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
} from 'react-bootstrap';

import {
  activateCustomerApi,
  createCustomerApi,
  deactivateCustomerApi,
  getCustomersApi,
  updateCustomerApi,
} from '../../api/customers.api';

import CustomerForm from './CustomerForm';

import { useAuth } from '../../context/AuthContext';

export default function Customers() {
  const { user } = useAuth();

  const [customers, setCustomers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [formLoading, setFormLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [showForm, setShowForm] =
    useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError('');

      const data =
        await getCustomersApi();

      setCustomers(
        Array.isArray(data)
          ? data
          : data.customers || []
      );
    } catch (error) {
      console.error(
        'Customers error:',
        error
      );

      setError(
        error.response?.data?.message ||
          'Failed to load customers'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return customers;
      }

      return customers.filter(
        (customer) =>
          customer.name
            ?.toLowerCase()
            .includes(value) ||
          customer.mobile
            ?.toLowerCase()
            .includes(value) ||
          customer.address
            ?.toLowerCase()
            .includes(value)
      );
    }, [customers, search]);

  const canManage =
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER';

  const handleAdd = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    setFormLoading(true);

    try {
      if (editingCustomer) {
        await updateCustomerApi(
          editingCustomer._id,
          data
        );
      } else {
        await createCustomerApi(data);
      }

      await loadCustomers();
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (
    customer
  ) => {
    try {
      setError('');

      if (customer.active) {
        await deactivateCustomerApi(
          customer._id
        );
      } else {
        await activateCustomerApi(
          customer._id
        );
      }

      await loadCustomers();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Failed to update customer status'
      );
    }
  };

  const formatQuantity = (value) => {
    const quantity = Number(value || 0);

    if (quantity === 0) {
      return '-';
    }

    return `${quantity} L`;
  };

  return (
    <div>
      {/* Heading */}
      <div className="page-heading">
        <div>
          <h2>
            Customers
          </h2>

          <p className="text-muted mb-0">
            Manage milk customers and
            delivery schedules
          </p>
        </div>

        {canManage && (
          <Button
            onClick={handleAdd}
          >
            + Add Customer
          </Button>
        )}
      </div>

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() =>
            setError('')
          }
        >
          {Array.isArray(error)
            ? error.join(', ')
            : error}
        </Alert>
      )}

      <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={5}>
              <Form.Control
                placeholder="Search by name, mobile or address..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </Col>

            <Col
              md={7}
              className="text-md-end mt-2 mt-md-0"
            >
              <span className="text-muted">
                Showing{' '}
                <strong>
                  {filteredCustomers.length}
                </strong>{' '}
                of{' '}
                <strong>
                  {customers.length}
                </strong>{' '}
                customers
              </span>
            </Col>
          </Row>

          {loading ? (
            <div className="page-loading">
              <Spinner animation="border" />

              <span>
                Loading customers...
              </span>
            </div>
          ) : filteredCustomers.length ===
            0 ? (
            <div className="text-center py-5">
              <h5>
                No customers found
              </h5>

              <p className="text-muted">
                {search
                  ? 'Try a different search.'
                  : 'Add your first customer to get started.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table
                hover
                responsive
                className="align-middle"
              >
                <thead>
                  <tr>
                    <th>
                      Customer
                    </th>

                    <th>
                      Mobile
                    </th>

                    <th>
                      Morning
                    </th>

                    <th>
                      Evening
                    </th>

                    <th>
                      Rate
                    </th>

                    <th>
                      Status
                    </th>

                    {canManage && (
                      <th className="text-end">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map(
                    (customer) => (
                      <tr
                        key={customer._id}
                      >
                        <td>
                          <div className="fw-semibold">
                            {customer.name}
                          </div>

                          {customer.address && (
                            <small className="text-muted">
                              {
                                customer.address
                              }
                            </small>
                          )}
                        </td>

                        <td>
                          {customer.mobile}
                        </td>

                        <td>
                          {formatQuantity(
                            customer.morning
                          )}
                        </td>

                        <td>
                          {formatQuantity(
                            customer.evening
                          )}
                        </td>

                        <td>
                          ₹
                          {Number(
                            customer.ratePerLiter ||
                              0
                          )}
                        </td>

                        <td>
                          {customer.active ? (
                            <Badge bg="success">
                              Active
                            </Badge>
                          ) : (
                            <Badge bg="secondary">
                              Inactive
                            </Badge>
                          )}
                        </td>

                        {canManage && (
                          <td className="text-end">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() =>
                                handleEdit(
                                  customer
                                )
                              }
                            >
                              Edit
                            </Button>

                            <Button
                              variant={
                                customer.active
                                  ? 'outline-danger'
                                  : 'outline-success'
                              }
                              size="sm"
                              onClick={() =>
                                handleToggleStatus(
                                  customer
                                )
                              }
                            >
                              {customer.active
                                ? 'Deactivate'
                                : 'Activate'}
                            </Button>
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <CustomerForm
        show={showForm}
        onHide={() =>
          setShowForm(false)
        }
        onSubmit={handleSubmit}
        customer={editingCustomer}
        loading={formLoading}
      />
    </div>
  );
}