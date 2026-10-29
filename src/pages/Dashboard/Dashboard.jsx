import { useEffect, useState } from 'react';

import {
  Alert,
  Col,
  Row,
  Spinner,
} from 'react-bootstrap';

import { getDashboardApi } from '../../api/dashboard.api';

import StatCard from '../../components/StatCard';
import './dashboard-phase7.css';

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
  const [language, setLanguage] = useState(() => localStorage.getItem("dairy-app-language") || "hi");

  useEffect(() => {
    const syncLanguage = (event) => setLanguage(event.detail || localStorage.getItem("dairy-app-language") || "hi");
    window.addEventListener("dairy-language-change", syncLanguage);
    return () => window.removeEventListener("dairy-language-change", syncLanguage);
  }, []);

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
    <div className="dashboard-page">
      <section className="page-hero dashboard-hero">
        <div className="page-hero-copy">
          <span className="eyebrow">{language === "hi" ? "आपके डेयरी का हाल" : "YOUR FARM AT A GLANCE"}</span>
          <h1>{language === "hi" ? "आपके डेयरी का हिसाब, एक जगह।" : "Good work starts with good records."}</h1>
          <p>{language === "hi" ? "दूध, ग्राहक, बिल और जमा पैसे का हिसाब आसानी से देखें।" : "Track milk production, deliveries, customer billing, and collections from one clear overview."}</p>
        </div>
        <div className="page-hero-period"><span>{language === "hi" ? "महीना चुनें" : "Reporting period"}</span><strong>{monthNames[month - 1]} {year}</strong><small>{language === "hi" ? "दूसरे महीने का हिसाब देखने के लिए नीचे चुनें।" : "Use the filters below to review another month."}</small></div>
      </section>
      {/* Page heading */}
      <div className="page-heading">
        <div>
          <h2>
            {language === "hi" ? "डेयरी का हिसाब" : "Farm overview"}
          </h2>

          <p className="text-muted mb-0">
            {language === "hi" ? "आज के काम की जानकारी" : "Overview of farm operations"}
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
      <h5 className="section-title"><span>{language === "hi" ? "ग्राहक" : "Customers"}</span><small>{language === "hi" ? "आपके ग्राहक" : "Your customer base"}</small></h5>

      <Row className="g-3 mb-4">
        <Col md={6} xl={3}>
          <StatCard
            title={language === "hi" ? "कुल ग्राहक" : "Total Customers"}
            value={formatNumber(
              customers.total
            )}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title={language === "hi" ? "चालू ग्राहक" : "Active Customers"}
            value={formatNumber(
              customers.active
            )}
          />
        </Col>
      </Row>

      {/* Animals */}
      <h5 className="section-title"><span>{language === "hi" ? "पशु" : "Animals"}</span><small>{language === "hi" ? "डेयरी के पशु" : "Your dairy animals"}</small></h5>

      <Row className="g-3 mb-4">
        <Col md={6} xl={3}>
          <StatCard
            title={language === "hi" ? "कुल पशु" : "Total Animals"}
            value={formatNumber(
              animals.total
            )}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title={language === "hi" ? "चालू पशु" : "Active Animals"}
            value={formatNumber(
              animals.active
            )}
          />
        </Col>
      </Row>

      {/* Milk */}
      <h5 className="section-title"><span>{language === "hi" ? "दूध का हिसाब" : "Milk operations"}</span><small>{language === "hi" ? "उत्पादन और सप्लाई" : "Production and delivery"}</small></h5>

      <Row className="g-3 mb-4">
        <Col md={6} xl={3}>
          <StatCard
            title={language === "hi" ? "कुल उत्पादन" : "Production"}
            value={`${formatNumber(
              production.totalLiters
            )} L`}
            subtitle={language === "hi" ? "कुल उत्पादित दूध" : "Total milk produced"}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title={language === "hi" ? "सुबह का उत्पादन" : "Production - Morning"}
            value={`${formatNumber(
              production.morningLiters
            )} L`}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title={language === "hi" ? "शाम का उत्पादन" : "Production - Evening"}
            value={`${formatNumber(
              production.eveningLiters
            )} L`}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title={language === "hi" ? "सप्लाई किया दूध" : "Delivered"}
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
      <h5 className="section-title"><span>{language === "hi" ? "पैसों का हिसाब" : "Finances"}</span><small>{language === "hi" ? "बिल, जमा और बाकी" : "Billing, collection and balance"}</small></h5>

      <Row className="g-3">
        <Col md={6} xl={3}>
          <StatCard
            title={language === "hi" ? "कुल बिल" : "Total Billing"}
            value={formatCurrency(
              billing.totalBilling
            )}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title={language === "hi" ? "जमा पैसे" : "Collected"}
            value={formatCurrency(
              billing.totalCollected
            )}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title={language === "hi" ? "बाकी पैसे" : "Pending"}
            value={formatCurrency(
              billing.totalPending
            )}
          />
        </Col>

        <Col md={6} xl={3}>
          <StatCard
            title={language === "hi" ? "भुगतान कर चुके ग्राहक" : "Paid Customers"}
            value={formatNumber(
              payments.paidCustomers
            )}
          />
        </Col>
      </Row>
    </div>
  );
}