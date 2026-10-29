import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Form, Spinner, Table } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { getActiveCustomersApi } from '../../api/customers.api';
import { generateMonthlyBillApi, getMonthlyBillsApi } from '../../api/bills.api';
import BillGenerateModal from './BillGenerateModal';
import BillDetailsModal from './BillDetailsModal';
import { getFarmYear, getFarmMonth } from '../../utils/farmDate';

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const money = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthName = (month) => monthNames[Number(month) - 1] || '';
const getYears = () => { const year = getFarmYear(); return Array.from({ length: 7 }, (_, index) => year - 3 + index); };

export default function Bills() {
  const { user } = useAuth();
  const [year, setYear] = useState(getFarmYear());
  const [month, setMonth] = useState(getFarmMonth());
  const [customers, setCustomers] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [generatingCustomerId, setGeneratingCustomerId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showGenerate, setShowGenerate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const loadCustomers = useCallback(async () => {
    const result = await getActiveCustomersApi();
    setCustomers(Array.isArray(result) ? result : result?.customers || []);
  }, []);

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getMonthlyBillsApi(year, month);
      setRows(Array.isArray(result?.customers) ? result.customers : []);
      setSummary(result?.summary || {});
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load this month billing records.");
      setRows([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { loadCustomers().catch((err) => setError(err?.response?.data?.message || 'Failed to load customers.')); }, [loadCustomers]);
  useEffect(() => { loadBills(); }, [loadBills]);

  const visibleRows = useMemo(() => rows.filter((row) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${row.customer?.name || ''} ${row.customer?.mobile || ''}`.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'UNBILLED' ? !row.generated && row.hasDeliveries : statusFilter === 'NO_DELIVERY' ? !row.hasDeliveries : row.status === statusFilter);
    return matchesSearch && matchesStatus;
  }), [rows, search, statusFilter]);

  const handleGenerate = async (customerId) => {
    setGeneratingCustomerId(customerId);
    setError('');
    setNotice('');
    try {
      await generateMonthlyBillApi(customerId, year, month);
      setShowGenerate(false);
      setNotice(`Bill generated or refreshed for ${monthName(month)} ${year}.`);
      await loadBills();
    } catch (err) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Failed to generate bill.');
    } finally {
      setGeneratingCustomerId('');
    }
  };

  const handleView = (row) => {
    setSelectedBill({ ...row, month, year });
    setShowDetails(true);
  };

  const refreshAfterPayment = async () => {
    await loadBills();
    if (!selectedBill?.billId) return;
    const refreshed = await getMonthlyBillsApi(year, month);
    const row = refreshed?.customers?.find((item) => String(item.billId) === String(selectedBill.billId));
    if (row) setSelectedBill({ ...row, month, year });
  };

  const customersWithDeliveries = customers.filter((customer) => rows.some((row) => String(row.customer?._id) === String(customer._id) && row.hasDeliveries));

  const totals = {
    billing: Number(summary.totalBilling || 0),
    estimated: Number(summary.totalEstimatedUnbilled || 0),
    collected: Number(summary.totalCollected || 0),
    pending: Number(summary.totalPending || 0),
    credit: Number(summary.totalCredit || 0),
    liters: Number(summary.totalMilkLiters || 0),
  };

  return <div className="billing-page">
    <section className="page-hero billing-hero">
      <div className="page-hero-copy">
        <span className="eyebrow">FARM FINANCE</span>
        <h1>मासिक बिलिंग <span className="billing-title-en">/ Monthly Billing</span></h1>
        <p>हर ग्राहक का दूध, बिल और बाकी भुगतान एक ही जगह देखें। <span className="billing-copy-en">Review deliveries, bills, and pending payments.</span></p>
      </div>
      <div className="page-hero-period"><span>चुना गया महीना / Selected period</span><strong>{monthName(month)} {year}</strong><small>हर डिलीवरी पर सेव किया गया दूध का भाव लागू है।</small></div>
    </section>

    {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{Array.isArray(error) ? error.join(', ') : error}</Alert>}
    {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}

    <Card className="filter-card mb-4"><Card.Body><div className="billing-toolbar">
      <div className="billing-period-fields">
        <Form.Group><Form.Label>महीना / Month</Form.Label><Form.Select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</Form.Select></Form.Group>
        <Form.Group><Form.Label>साल / Year</Form.Label><Form.Select value={year} onChange={(event) => setYear(Number(event.target.value))}>{getYears().map((item) => <option key={item} value={item}>{item}</option>)}</Form.Select></Form.Group>
      </div>
      <div className="billing-toolbar-actions"><Form.Control aria-label="Search customer" placeholder="नाम या मोबाइल खोजें / Search" value={search} onChange={(event) => setSearch(event.target.value)} /><Button variant="outline-secondary" onClick={() => { setYear(getFarmYear()); setMonth(getFarmMonth()); setSearch(''); setStatusFilter('ALL'); }}>आज का महीना / Current</Button>{canManage && <Button onClick={() => setShowGenerate(true)}>＋ बिल बनाएँ / Generate bill</Button>}</div>
    </div></Card.Body></Card>

    <div className="billing-metric-grid">
      <MetricCard tone="teal" label="बने हुए बिल / Generated billing" value={`₹${money(totals.billing)}`} note={`${Number(summary.generatedBills || 0)} बिल तैयार / bills finalized`} />
      <MetricCard tone="gold" label="बिना बिल का अनुमान / Unbilled estimate" value={`₹${money(totals.estimated)}`} note={`${Number(summary.ungeneratedCustomers || 0)} ग्राहकों का बिल बाकी`} />
      <MetricCard tone="green" label="जमा भुगतान / Collected" value={`₹${money(totals.collected)}`} note="दर्ज किए गए भुगतान" />
      <MetricCard tone="coral" label="बाकी भुगतान / Pending" value={`₹${money(totals.pending)}`} note="बने हुए बिलों पर बाकी राशि" />
      <MetricCard tone="purple" label="ग्राहक क्रेडिट / Credit" value={`₹${money(totals.credit)}`} note="ज्यादा जमा राशि सुरक्षित" />
      <MetricCard tone="teal" label="दूध की मात्रा / Milk delivered" value={`${totals.liters.toFixed(2)} L`} note="दर्ज की गई असली डिलीवरी" />
    </div>

    <div className="billing-section-heading"><div><h2>ग्राहक का हिसाब <span className="billing-heading-en">/ Customer statement</span></h2><p>अनुमानित राशि और बने हुए बिल अलग-अलग दिखाए गए हैं।</p></div><div className="billing-status-filter"><Form.Select aria-label="Filter billing status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">सभी ग्राहक / All</option><option value="UNBILLED">बिल बनाना बाकी</option><option value="PENDING">भुगतान बाकी</option><option value="PARTIAL">कुछ भुगतान हुआ</option><option value="PAID">पूरा भुगतान</option><option value="NO_DELIVERY">डिलीवरी नहीं</option></Form.Select></div></div>

    <Card className="billing-table-card"><Card.Body className="p-0">
      {loading ? <div className="state-panel"><Spinner animation="border" /><span>बिलिंग रिकॉर्ड लोड हो रहे हैं…</span></div> : visibleRows.length === 0 ? <div className="state-panel"><div className="empty-state-icon">▤</div><h3>कोई ग्राहक नहीं मिला</h3><p>दूसरा नाम खोजें या फ़िल्टर बदलें।</p></div> : <div className="table-responsive"><Table hover className="billing-table mb-0 align-middle"><thead><tr><th>ग्राहक / Customer</th><th>दूध / Milk</th><th>भाव / लीटर</th><th>बिल / अनुमान</th><th>जमा</th><th>बाकी</th><th>स्थिति / Status</th><th className="text-end">कार्य / Action</th></tr></thead><tbody>
        {visibleRows.map((row) => <tr key={row.customer?._id || row.billId}>
          <td><div className="customer-cell"><span className="customer-avatar">{(row.customer?.name || '?').trim().charAt(0).toUpperCase()}</span><div><strong>{row.customer?.name || 'Unknown customer'}</strong><small>{row.customer?.mobile || 'No mobile'}</small></div></div></td>
          <td><strong>{Number(row.totalLiters || 0).toFixed(2)} L</strong></td>
          <td>₹{money(row.ratePerLiter)}<small className="table-subline">per litre</small></td>
          <td><strong>₹{money(row.totalAmount)}</strong><small className="table-subline">{row.generated ? 'बिल तैयार / Finalized' : row.hasDeliveries ? 'अनुमान · बिल बाकी' : 'डिलीवरी नहीं'}</small></td>
          <td className="money-paid">₹{money(row.paidAmount)}</td>
          <td className={row.pendingAmount > 0 ? 'money-pending' : ''}>₹{money(row.pendingAmount)}{row.creditAmount > 0 && <small className="table-subline">₹{money(row.creditAmount)} credit</small>}</td>
          <td><StatusBadge status={row.status} /></td>
          <td className="text-end">{row.generated ? <div className="d-flex justify-content-end gap-2"><Button size="sm" variant="outline-primary" onClick={() => handleView(row)}>View</Button>{canManage && row.hasDeliveries && <Button size="sm" variant="outline-secondary" disabled={generatingCustomerId === row.customer?._id} onClick={() => handleGenerate(row.customer._id)}>{generatingCustomerId === row.customer?._id ? 'अपडेट हो रहा…' : 'बिल अपडेट करें'}</Button>}</div> : row.hasDeliveries && canManage ? <Button size="sm" disabled={generatingCustomerId === row.customer?._id} onClick={() => handleGenerate(row.customer._id)}>{generatingCustomerId === row.customer?._id ? <><Spinner size="sm" className="me-1" />Generating</> : 'बिल बनाएँ'}</Button> : <span className="text-muted small">—</span>}</td>
        </tr>)}
      </tbody></Table></div>}
    </Card.Body></Card>
    <div className="billing-footnote"><span className="footnote-dot" /> <span>बिल बनने से पहले अनुमानित राशि को देय भुगतान नहीं माना जाता। डिलीवरी बदलने पर बिल दोबारा हिसाब होता है; पुराने भुगतान सुरक्षित रहते हैं और अतिरिक्त राशि ग्राहक क्रेडिट में दिखती है।</span></div>

    <BillGenerateModal show={showGenerate} onHide={() => setShowGenerate(false)} onSubmit={handleGenerate} customers={customersWithDeliveries} year={year} month={month} loading={Boolean(generatingCustomerId)} />
    <BillDetailsModal show={showDetails} onHide={() => setShowDetails(false)} bill={selectedBill} onPaymentSuccess={refreshAfterPayment} />
  </div>;
}

function MetricCard({ tone, label, value, note }) { return <Card className={`billing-metric billing-metric--${tone}`}><Card.Body><div className="billing-metric-top"><span>{label}</span><span className="metric-dot" /></div><div className="billing-metric-value">{value}</div><small>{note}</small></Card.Body></Card>; }
function StatusBadge({ status }) {
  const config = {
    PAID: ['success', 'भुगतान पूरा / Paid'], PARTIAL: ['warning', 'कुछ भुगतान / Partial'], PENDING: ['danger', 'भुगतान बाकी / Pending'],
    NOT_GENERATED: ['info', 'बिल नहीं बना'], NO_DELIVERY: ['secondary', 'डिलीवरी नहीं'],
  }[status] || ['secondary', status || 'Unknown'];
  return <Badge bg={config[0]}>{config[1]}</Badge>;
}
