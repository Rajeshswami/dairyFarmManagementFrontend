import { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { createPaymentApi, updatePaymentApi } from '../../api/payments.api';

const METHODS = ['CASH', 'UPI', 'BANK'];
const getToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const money = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PaymentFormModal({ show, onHide, bill, payment, onSuccess }) {
  const editing = Boolean(payment);
  const [language, setLanguage] = useState(() => localStorage.getItem('dairy-app-language') || 'hi');
  const hi = language === 'hi';
  const [form, setForm] = useState({ amount: '', paymentDate: getToday(), paymentMethod: 'CASH', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pending = Number(bill?.pendingAmount || 0);
  const quickAmounts = [100, 200, 500, 1000].filter((amount) => amount <= pending);

  useEffect(() => {
    const syncLanguage = (event) => setLanguage(event.detail || localStorage.getItem('dairy-app-language') || 'hi');
    window.addEventListener('dairy-language-change', syncLanguage);
    return () => window.removeEventListener('dairy-language-change', syncLanguage);
  }, []);

  useEffect(() => {
    if (!show) return;
    if (payment) {
      setForm({ amount: payment.amount ?? '', paymentDate: payment.paymentDate ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(payment.paymentDate)) : getToday(), paymentMethod: payment.paymentMethod || 'CASH', note: payment.note || '' });
    } else {
      setForm({ amount: pending > 0 ? String(pending) : '', paymentDate: getToday(), paymentMethod: 'CASH', note: '' });
    }
    setError('');
  }, [show, bill, payment, pending]);

  const change = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setError(hi ? 'सही रकम दर्ज करें।' : 'Enter a valid payment amount.'); return; }
    if (!editing && amount > pending) { setError(`${hi ? 'जमा रकम बाकी रकम से ज़्यादा नहीं हो सकती:' : 'Payment cannot exceed the pending amount:'} ₹${money(pending)}.`); return; }
    if (!editing && (!bill?.billId || !bill?.customer?._id)) { setError(hi ? 'बिल या ग्राहक की जानकारी नहीं मिली।' : 'Bill or customer details are missing.'); return; }
    try {
      setSaving(true);
      const payload = { amount, paymentDate: form.paymentDate, paymentMethod: form.paymentMethod, note: form.note.trim() || undefined };
      if (editing) await updatePaymentApi(payment.paymentId, payload);
      else await createPaymentApi({ ...payload, customerId: bill.customer._id, billId: bill.billId });
      await onSuccess?.();
      onHide?.();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || (hi ? 'भुगतान सेव नहीं हुआ।' : 'Unable to save payment.'));
    } finally { setSaving(false); }
  };

  return <Modal show={show} onHide={onHide} centered backdrop="static" dialogClassName="farmer-payment-modal">
    <Form onSubmit={submit}>
      <Modal.Header closeButton><Modal.Title>{editing ? (hi ? 'भुगतान में बदलाव' : 'Edit payment') : (hi ? 'पैसा जमा करें' : 'Record payment')}</Modal.Title></Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {bill && !editing && <div className="farmer-payment-modal-summary"><div><span>{hi ? 'कुल बिल' : 'Bill total'}</span><strong>₹{money(bill.totalAmount)}</strong></div><div><span>{hi ? 'पहले जमा' : 'Already paid'}</span><strong>₹{money(bill.paidAmount)}</strong></div><div><span>{hi ? 'अब बाकी' : 'Remaining'}</span><strong>₹{money(pending)}</strong></div></div>}
        <Form.Group className="mb-3"><Form.Label className="farmer-large-label">{hi ? 'कितने रुपये जमा हुए?' : 'Amount received (₹)'} *</Form.Label><Form.Control autoFocus className="farmer-large-control farmer-payment-amount-input" type="number" min="0.01" max={!editing ? pending : undefined} step="0.01" name="amount" value={form.amount} onChange={change} required /></Form.Group>
        {!editing && quickAmounts.length > 0 && <div className="farmer-quick-amounts mb-3"><span>{hi ? 'जल्दी चुनें' : 'Quick amount'}</span><div>{quickAmounts.map((amount) => <Button type="button" key={amount} variant="outline-success" onClick={() => setForm((current) => ({ ...current, amount: String(amount) }))}>₹{amount}</Button>)}{pending > 0 && <Button type="button" variant="outline-primary" onClick={() => setForm((current) => ({ ...current, amount: String(pending) }))}>{hi ? 'पूरा बाकी' : 'Full balance'}</Button>}</div></div>}
        <Form.Group className="mb-3"><Form.Label className="farmer-large-label">{hi ? 'किस तारीख को?' : 'Payment date'} *</Form.Label><Form.Control className="farmer-large-control" type="date" name="paymentDate" value={form.paymentDate} onChange={change} required /></Form.Group>
        <Form.Group className="mb-3"><Form.Label className="farmer-large-label">{hi ? 'पैसा कैसे मिला?' : 'Payment method'} *</Form.Label><div className="farmer-payment-methods">{METHODS.map((method) => <button type="button" key={method} className={`farmer-payment-method ${form.paymentMethod === method ? 'is-selected' : ''}`} onClick={() => setForm((current) => ({ ...current, paymentMethod: method }))}><span>{method === 'CASH' ? '💵' : method === 'UPI' ? '📱' : '🏦'}</span><strong>{method === 'CASH' ? (hi ? 'नकद' : 'Cash') : method === 'UPI' ? 'UPI' : (hi ? 'बैंक' : 'Bank')}</strong></button>)}</div></Form.Group>
        <Form.Group><Form.Label>{hi ? 'लिखना चाहें तो (ज़रूरी नहीं)' : 'Note (optional)'}</Form.Label><Form.Control as="textarea" rows={2} name="note" value={form.note} onChange={change} placeholder={hi ? 'जैसे: नकद मिला' : 'e.g. cash received'} /></Form.Group>
      </Modal.Body>
      <Modal.Footer className="farmer-payment-modal-footer"><Button variant="outline-secondary" size="lg" onClick={onHide} disabled={saving}>{hi ? 'रद्द करें' : 'Cancel'}</Button><Button type="submit" className="farmer-payment-primary" size="lg" disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-2" />{hi ? 'सेव हो रहा है…' : 'Saving…'}</> : (hi ? 'भुगतान सेव करें' : 'Save payment')}</Button></Modal.Footer>
    </Form>
  </Modal>;
}
