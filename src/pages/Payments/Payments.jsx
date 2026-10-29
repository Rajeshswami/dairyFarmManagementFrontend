import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { getActiveCustomersApi } from '../../api/customers.api';
import { getCustomerPaymentsApi } from '../../api/payments.api';
import { getMonthlyBillsApi } from '../../api/bills.api';
import PaymentFormModal from './PaymentFormModal';

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_HI = ['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
const money = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const getFarmDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const getInitialPeriod = () => { const [year, month] = getFarmDate().split('-').map(Number); return { year, month }; };
const years = () => { const now = Number(getFarmDate().slice(0, 4)); return Array.from({ length: 7 }, (_, i) => now - 3 + i); };

function Payments() {
  const [language, setLanguage] = useState(() => localStorage.getItem('dairy-app-language') || 'hi');
  const hi = language === 'hi';
  const [period, setPeriod] = useState(getInitialPeriod);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [data, setData] = useState({ count: 0, totalPaid: 0, payments: [] });
  const [monthlyRows, setMonthlyRows] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editPayment, setEditPayment] = useState(null);
  const [collectingBill, setCollectingBill] = useState(null);

  useEffect(() => {
    const syncLanguage = (event) => setLanguage(event.detail || localStorage.getItem('dairy-app-language') || 'hi');
    window.addEventListener('dairy-language-change', syncLanguage);
    return () => window.removeEventListener('dairy-language-change', syncLanguage);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingCustomers(true);
        const result = await getActiveCustomersApi();
        if (alive) setCustomers(Array.isArray(result) ? result : result?.customers || []);
      } catch (err) {
        if (alive) setError(err?.response?.data?.message || (hi ? 'ग्राहक लोड नहीं हो सके।' : 'Could not load customers.'));
      } finally { if (alive) setLoadingCustomers(false); }
    })();
    return () => { alive = false; };
  }, [hi]);

  const loadPayments = useCallback(async () => {
    if (!selectedCustomer) {
      setData({ count: 0, totalPaid: 0, payments: [] });
      return;
    }
    try {
      setLoadingPayments(true);
      const result = await getCustomerPaymentsApi(selectedCustomer);
      setData({ count: Number(result?.count || 0), totalPaid: Number(result?.totalPaid || 0), payments: Array.isArray(result?.payments) ? result.payments : [] });
    } catch (err) {
      setError(err?.response?.data?.message || (hi ? 'भुगतान इतिहास लोड नहीं हुआ।' : 'Could not load payment history.'));
    } finally { setLoadingPayments(false); }
  }, [selectedCustomer, hi]);

  const loadBills = useCallback(async () => {
    try {
      setLoadingBills(true);
      const result = await getMonthlyBillsApi(period.year, period.month);
      setMonthlyRows(Array.isArray(result?.customers) ? result.customers : []);
    } catch (err) {
      setMonthlyRows([]);
      setError(err?.response?.data?.message || (hi ? 'इस महीने के बिल लोड नहीं हुए।' : 'Could not load bills for this month.'));
    } finally { setLoadingBills(false); }
  }, [period.year, period.month, hi]);

  useEffect(() => { loadPayments(); }, [loadPayments]);
  useEffect(() => { loadBills(); }, [loadBills]);

  const selectedCustomerObject = customers.find((customer) => String(customer._id) === String(selectedCustomer));
  const customerBillRow = monthlyRows.find((row) => String(row.customer?._id || row.customer?._id) === String(selectedCustomer));
  const bill = customerBillRow?.generated && customerBillRow?.billId ? {
    ...customerBillRow,
    billId: customerBillRow.billId,
    customer: customerBillRow.customer || selectedCustomerObject,
    month: period.month,
    year: period.year,
  } : null;
  const pending = Number(bill?.pendingAmount || 0);
  const currentMonthLabel = `${(hi ? MONTHS_HI : MONTHS_EN)[period.month - 1]} ${period.year}`;
  const yearsList = useMemo(years, []);

  const refreshAll = async () => {
    await Promise.all([loadPayments(), loadBills()]);
    setNotice(hi ? 'भुगतान रिकॉर्ड अपडेट हो गया।' : 'Payment records updated.');
  };

  return <div className="farmer-payments-page">
    <section className="farmer-payment-hero">
      <div>
        <span className="farmer-eyebrow">{hi ? 'डेयरी का हिसाब' : 'FARM ACCOUNTS'}</span>
        <h1>{hi ? 'पैसे जमा करें' : 'Collect payment'}</h1>
        <p>{hi ? 'ग्राहक चुनें, बकाया देखें और जमा रकम दर्ज करें।' : 'Choose a customer, check the balance, and record money received.'}</p>
      </div>
      <div className="farmer-payment-hero-icon" aria-hidden="true">₹</div>
    </section>

    {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{Array.isArray(error) ? error.join(', ') : error}</Alert>}
    {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}

    <Card className="farmer-payment-card mb-4"><Card.Body>
      <Row className="g-3 align-items-end">
        <Col xs={12} md={6}>
          <Form.Group>
            <Form.Label className="farmer-large-label">{hi ? 'ग्राहक चुनें' : 'Choose customer'}</Form.Label>
            <Form.Select className="farmer-large-control" value={selectedCustomer} onChange={(event) => { setSelectedCustomer(event.target.value); setNotice(''); setError(''); }} disabled={loadingCustomers}>
              <option value="">{loadingCustomers ? (hi ? 'लोड हो रहा है…' : 'Loading customers…') : (hi ? 'ग्राहक का नाम चुनें' : 'Select customer name')}</option>
              {customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}{customer.mobile ? ` · ${customer.mobile}` : ''}</option>)}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col xs={7} md={3}>
          <Form.Group>
            <Form.Label className="farmer-large-label">{hi ? 'महीना' : 'Month'}</Form.Label>
            <Form.Select className="farmer-large-control" value={period.month} onChange={(event) => setPeriod((current) => ({ ...current, month: Number(event.target.value) }))}>{(hi ? MONTHS_HI : MONTHS_EN).map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</Form.Select>
          </Form.Group>
        </Col>
        <Col xs={5} md={3}>
          <Form.Group>
            <Form.Label className="farmer-large-label">{hi ? 'साल' : 'Year'}</Form.Label>
            <Form.Select className="farmer-large-control" value={period.year} onChange={(event) => setPeriod((current) => ({ ...current, year: Number(event.target.value) }))}>{yearsList.map((year) => <option key={year} value={year}>{year}</option>)}</Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </Card.Body></Card>

    {selectedCustomer && <>
      <div className="farmer-payment-summary-grid">
        <Card className="farmer-payment-summary farmer-payment-summary--blue"><Card.Body><span>{hi ? 'इस महीने का बिल' : 'Bill for this month'}</span><strong>₹{money(bill?.totalAmount || 0)}</strong><small>{currentMonthLabel}</small></Card.Body></Card>
        <Card className="farmer-payment-summary farmer-payment-summary--green"><Card.Body><span>{hi ? 'अब तक जमा' : 'Already paid'}</span><strong>₹{money(bill?.paidAmount || 0)}</strong><small>{hi ? 'दर्ज भुगतान' : 'Recorded payments'}</small></Card.Body></Card>
        <Card className={`farmer-payment-summary ${pending > 0 ? 'farmer-payment-summary--gold' : 'farmer-payment-summary--green'}`}><Card.Body><span>{hi ? 'बाकी पैसा' : 'Still due'}</span><strong>₹{money(pending)}</strong><small>{bill ? (hi ? 'बिल बना हुआ है' : 'Bill generated') : (hi ? 'पहले बिल बनाना ज़रूरी है' : 'Generate the bill first')}</small></Card.Body></Card>
      </div>

      <Card className="farmer-payment-card mb-4"><Card.Body>
        <div className="farmer-payment-action-row">
          <div><h2>{hi ? 'पैसा जमा करें' : 'Record money received'}</h2><p>{bill ? (hi ? 'नीचे बटन दबाकर भुगतान दर्ज करें।' : 'Tap the button below to record a payment.') : (hi ? 'इस ग्राहक का इस महीने का बिल अभी नहीं बना है।' : 'This customer does not have a generated bill for this month yet.')}</p></div>
          <Button className="farmer-payment-primary" disabled={!bill || pending <= 0 || loadingBills} onClick={() => setCollectingBill(bill)}>{loadingBills ? <Spinner size="sm" /> : '₹'} {hi ? 'भुगतान दर्ज करें' : 'Record payment'}</Button>
        </div>
        {!bill && <Alert variant="info" className="mb-0">{hi ? 'बिल वाले पेज पर जाकर पहले इस महीने का बिल बनाएं। उसके बाद यहाँ भुगतान दर्ज कर सकते हैं।' : 'Generate this month’s bill from the Bills page before recording a payment here.'}</Alert>}
        {bill && pending <= 0 && <Alert variant="success" className="mb-0">{hi ? 'इस महीने कोई बकाया नहीं है।' : 'Nothing is due for this month.'}</Alert>}
      </Card.Body></Card>

      <Card className="farmer-payment-card"><Card.Body>
        <div className="farmer-payment-section-heading"><div><h2>{hi ? 'भुगतान का इतिहास' : 'Payment history'}</h2><p>{selectedCustomerObject?.name || ''}</p></div><div className="farmer-payment-total-paid"><span>{hi ? 'कुल जमा' : 'Total collected'}</span><strong>₹{money(data.totalPaid)}</strong></div></div>
        <div className="farmer-payment-mini-stats"><div><span>{hi ? 'भुगतान की संख्या' : 'Payments recorded'}</span><strong>{data.count}</strong></div><div><span>{hi ? 'चुना महीना' : 'Selected month'}</span><strong>{currentMonthLabel}</strong></div></div>
        {loadingPayments ? <div className="farmer-payment-state"><Spinner animation="border" /><span>{hi ? 'भुगतान लोड हो रहे हैं…' : 'Loading payments…'}</span></div> : data.payments.length === 0 ? <div className="farmer-payment-state"><span className="farmer-payment-empty-icon">₹</span><strong>{hi ? 'अभी कोई भुगतान दर्ज नहीं है' : 'No payments recorded yet'}</strong><span>{hi ? 'भुगतान दर्ज होने पर यहाँ दिखाई देगा।' : 'Payments will appear here once recorded.'}</span></div> : <div className="table-responsive"><Table hover className="farmer-payment-table align-middle mb-0"><thead><tr><th>{hi ? 'तारीख' : 'Date'}</th><th>{hi ? 'बिल का महीना' : 'Bill month'}</th><th>{hi ? 'जमा रकम' : 'Amount received'}</th><th>{hi ? 'तरीका' : 'Method'}</th><th>{hi ? 'बकाया' : 'Balance due'}</th><th>{hi ? 'स्थिति' : 'Status'}</th><th>{hi ? 'काम' : 'Action'}</th></tr></thead><tbody>{data.payments.map((payment) => { const itemBill = payment.bill; const variant = itemBill?.status === 'PAID' ? 'success' : itemBill?.status === 'PARTIAL' ? 'warning' : 'danger'; return <tr key={payment.paymentId}><td>{new Date(payment.paymentDate).toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { timeZone: 'Asia/Kolkata' })}</td><td>{itemBill ? `${(hi ? MONTHS_HI : MONTHS_EN)[Number(itemBill.month) - 1]} ${itemBill.year}` : '—'}</td><td className="fw-bold">₹{money(payment.amount)}</td><td>{({ CASH: hi ? 'नकद' : 'Cash', UPI: 'UPI', BANK: hi ? 'बैंक' : 'Bank' })[payment.paymentMethod] || payment.paymentMethod}</td><td>₹{money(itemBill?.pendingAmount)}</td><td><Badge bg={variant}>{itemBill?.status === 'PAID' ? (hi ? 'पूरा जमा' : 'Paid') : itemBill?.status === 'PARTIAL' ? (hi ? 'कुछ जमा' : 'Partially paid') : (hi ? 'बाकी' : 'Pending')}</Badge></td><td><Button variant="outline-secondary" size="sm" className="farmer-payment-edit" onClick={() => setEditPayment(payment)}>{hi ? 'बदलें' : 'Edit'}</Button></td></tr>; })}</tbody></Table></div>}
      </Card.Body></Card>
    </>}

    {editPayment && <PaymentFormModal show payment={editPayment} onHide={() => setEditPayment(null)} onSuccess={async () => { setEditPayment(null); await refreshAll(); }} />}
    {collectingBill && <PaymentFormModal show bill={collectingBill} onHide={() => setCollectingBill(null)} onSuccess={async () => { setCollectingBill(null); await refreshAll(); }} />}
  </div>;
}

export default Payments;
