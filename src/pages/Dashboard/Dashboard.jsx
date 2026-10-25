import { useEffect, useState } from 'react';
import { Alert, Col, Row, Spinner } from 'react-bootstrap';
import { getDashboardApi } from '../../api/dashboard.api';
import StatCard from '../../components/StatCard';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function Dashboard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getDashboardApi(year, month);
        if (active) setDashboard(data);
      } catch (err) {
        console.error('Dashboard error:', err);
        if (active) setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDashboard();
    return () => { active = false; };
  }, [year, month]);

  if (loading) return <div className="page-loading"><Spinner animation="border" /><span>Loading your farm overview...</span></div>;
  if (error) return <Alert variant="danger">{Array.isArray(error) ? error.join(', ') : error}</Alert>;
  if (!dashboard) return null;

  const customers = dashboard.customers || {};
  const animals = dashboard.animals || {};
  const production = dashboard.production || {};
  const delivery = dashboard.delivery || {};
  const billing = dashboard.billing || {};
  const payments = dashboard.payments || {};
  const selectedMonthName = monthNames[month - 1];

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="dashboard-kicker"><span className="live-dot" /> YOUR FARM AT A GLANCE</div>
          <h1>Good farming starts<br className="hero-break" /> with a clear picture.</h1>
          <p>Track your herd, milk movement, and business performance in one place.</p>
          <div className="hero-period"><span className="hero-calendar" aria-hidden="true">▦</span> Overview for <strong>{selectedMonthName} {year}</strong></div>
        </div>
        <div className="dashboard-hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="hero-milk-badge">🥛</div><div className="hero-leaf leaf-one">✦</div><div className="hero-leaf leaf-two">✦</div>
          <div className="hero-art-caption"><strong>Fresh. Local. Reliable.</strong><span>One farm, one overview.</span></div>
        </div>
        <div className="dashboard-filters hero-filters">
          <select aria-label="Select month" className="form-select" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
            {monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
          </select>
          <select aria-label="Select year" className="form-select" value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {[year - 2, year - 1, year, year + 1].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <div className="dashboard-section-heading">
        <div><span className="section-kicker">YOUR COMMUNITY</span><h2>Customers & herd</h2></div>
        <p>The people and animals at the heart of your farm.</p>
      </div>
      <Row className="g-3 dashboard-stat-row">
        <Col xs={6} xl={3}><StatCard title="Total customers" value={formatNumber(customers.total)} subtitle="All registered customers" icon="♙" tone="green" /></Col>
        <Col xs={6} xl={3}><StatCard title="Active customers" value={formatNumber(customers.active)} subtitle="Currently receiving service" icon="✓" tone="mint" /></Col>
        <Col xs={6} xl={3}><StatCard title="Total animals" value={formatNumber(animals.total)} subtitle="Animals registered" icon="🐄" tone="gold" /></Col>
        <Col xs={6} xl={3}><StatCard title="Active animals" value={formatNumber(animals.active)} subtitle="Currently on the farm" icon="✦" tone="blue" /></Col>
      </Row>

      <div className="dashboard-section-heading dashboard-section-spaced">
        <div><span className="section-kicker">DAILY OPERATIONS</span><h2>Milk at a glance</h2></div>
        <span className="section-note">Measured in litres</span>
      </div>
      <Row className="g-3 dashboard-stat-row">
        <Col xs={6} xl={3}><StatCard title="Total produced" value={`${formatNumber(production.totalLiters)} L`} subtitle="Milk produced this period" icon="◉" tone="green" /></Col>
        <Col xs={6} xl={3}><StatCard title="Morning production" value={`${formatNumber(production.morningLiters)} L`} subtitle="Morning milking" icon="☀" tone="gold" /></Col>
        <Col xs={6} xl={3}><StatCard title="Evening production" value={`${formatNumber(production.eveningLiters)} L`} subtitle="Evening milking" icon="☾" tone="blue" /></Col>
        <Col xs={6} xl={3}><StatCard title="Milk delivered" value={`${formatNumber(delivery.totalLiters)} L`} subtitle={`${formatCurrency(delivery.totalAmount)} delivery value`} icon="↗" tone="mint" /></Col>
      </Row>

      <div className="dashboard-section-heading dashboard-section-spaced">
        <div><span className="section-kicker">BUSINESS HEALTH</span><h2>Money overview</h2></div>
        <span className="section-note">Selected billing period</span>
      </div>
      <Row className="g-3 dashboard-stat-row">
        <Col xs={6} xl={3}><StatCard title="Total billing" value={formatCurrency(billing.totalBilling)} subtitle="Bills generated" icon="▤" tone="blue" /></Col>
        <Col xs={6} xl={3}><StatCard title="Collected" value={formatCurrency(billing.totalCollected)} subtitle="Payments received" icon="₹" tone="green" /></Col>
        <Col xs={6} xl={3}><StatCard title="Outstanding" value={formatCurrency(billing.totalPending)} subtitle="Balance yet to collect" icon="◷" tone="rose" /></Col>
        <Col xs={6} xl={3}><StatCard title="Paid customers" value={formatNumber(payments.paidCustomers)} subtitle="Customers paid in full" icon="✓" tone="mint" /></Col>
      </Row>
      <footer className="dashboard-footer"><span>🐄</span> Small daily steps make a stronger farm. <span className="footer-period">{selectedMonthName} {year}</span></footer>
    </div>
  );
}
