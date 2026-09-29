import { useEffect, useState } from 'react';

import {
  Alert,
  Col,
  Row,
  Spinner,
} from 'react-bootstrap';

import { getDashboardApi } from '../../api/dashboard.api';

import StatCard from '../../components/StatCard';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    }
  );
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

export default function Dashboard() {
  const now = new Date();

  const [year, setYear] = useState(
    now.getFullYear()
  );

  const [month, setMonth] = useState(
    now.getMonth() + 1
  );

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const data =
        await getDashboardApi(
          year,
          month
        );

      setDashboard(data);
    } catch (error) {
      console.error(
        'Dashboard error:',
        error
      );

      setError(
        error.response?.data?.message ||
          'Failed to load dashboard'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [year, month]);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner animation="border" />

        <span>
          Loading dashboard...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {Array.isArray(error)
          ? error.join(', ')
          : error}
      </Alert>
    );
  }

  if (!dashboard) {
    return null;
  }

  const customers =
    dashboard.customers || {};

  const animals =
    dashboard.animals || {};

  const production =
    dashboard.production || {};

  const delivery =
    dashboard.delivery || {};

  const billing =
    dashboard.billing || {};

  const payments =
    dashboard.payments || {};

  return (
    <div>
      {/* Page heading */}
      <div className="page-heading">
        <div>
          <h2>
            Dashboard
          </h2>

          <p className="text-muted mb-0">
            Overview of farm operations
          </p>
        </div>

        <div className="dashboard-filters">
          <select
            className="form-select"
            value={month}
            onChange={(event) =>
              setMonth(
                Number(event.target.value)
              )
            }
          >
            {monthNames.map(
              (name, index) => (
                <option
                  key={name}
                  value={index + 1}
                >
                  {name}
                </option>
              )
            )}
          </select>

          <select
            className="form-select"
            value={year}
            onChange={(event) =>
              setYear(
                Number(event.target.value)
              )
            }
          >
            {[
              year - 2,
              year - 1,
              year,
              year + 1,
            ].map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers */}
      <h5 className="section-title">
        Customers
      </h5>

      <Row className="g-3 mb-4">
        <Col md={6} xl={3}>
          <StatCard
            title="Total Customers"
            value={formatNumber(
              customers.total
            )}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title="Active Customers"
            value={formatNumber(
              customers.active
            )}
          />
        </Col>
      </Row>

      {/* Animals */}
      <h5 className="section-title">
        Animals
      </h5>

      <Row className="g-3 mb-4">
        <Col md={6} xl={3}>
          <StatCard
            title="Total Animals"
            value={formatNumber(
              animals.total
            )}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title="Active Animals"
            value={formatNumber(
              animals.active
            )}
          />
        </Col>
      </Row>

      {/* Milk */}
      <h5 className="section-title">
        Milk Operations
      </h5>

      <Row className="g-3 mb-4">
        <Col md={6} xl={3}>
          <StatCard
            title="Production"
            value={`${formatNumber(
              production.totalLiters
            )} L`}
            subtitle="Total milk produced"
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title="Production - Morning"
            value={`${formatNumber(
              production.morningLiters
            )} L`}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title="Production - Evening"
            value={`${formatNumber(
              production.eveningLiters
            )} L`}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title="Delivered"
            value={`${formatNumber(
              delivery.totalLiters
            )} L`}
            subtitle={formatCurrency(
              delivery.totalAmount
            )}
          />
        </Col>
      </Row>

      {/* Financial */}
      <h5 className="section-title">
        Financial
      </h5>

      <Row className="g-3">
        <Col md={6} xl={3}>
          <StatCard
            title="Total Billing"
            value={formatCurrency(
              billing.totalBilling
            )}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title="Collected"
            value={formatCurrency(
              billing.totalCollected
            )}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title="Pending"
            value={formatCurrency(
              billing.totalPending
            )}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title="Paid Customers"
            value={formatNumber(
              payments.paidCustomers
            )}
          />
        </Col>
      </Row>
    </div>
  );
}