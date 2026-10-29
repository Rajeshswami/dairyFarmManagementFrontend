import { useEffect, useMemo, useState } from "react";
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
} from "react-bootstrap";

import {
  getMilkDeliveriesApi,
  createMilkDeliveryApi,
  updateMilkDeliveryApi,
  deleteMilkDeliveryApi,
} from "../../api/milkDelivery.api";

import { getActiveCustomersApi } from "../../api/customers.api";

// Milk delivery quantity options: 0 to 10 litres in 0.25 L steps.
const QUANTITIES = Array.from({ length: 41 }, (_, index) => {
  const value = index * 0.25;

  let label;
  if (value === 0) label = "0";
  else if (value === 0.25) label = "¼ L";
  else if (value === 0.5) label = "½ L";
  else if (value === 0.75) label = "¾ L";
  else label = `${value.toFixed(2).replace(/\.00$/, "")} L`;

  return { value, label };
});

const formatLiters = (value) => `${Number(value || 0).toFixed(2)} L`;

const getToday = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const QUICK_QUANTITIES = [0, 0.5, 1, 1.5, 2, 3];

const COPY = {
  hi: {
    title: "दूध की डिलीवरी",
    subtitle: "ग्राहकों को आज दिया गया दूध दर्ज करें",
    date: "तारीख",
    today: "आज",
    refresh: "फिर से देखें",
    morning: "सुबह का दूध",
    evening: "शाम का दूध",
    total: "कुल दूध",
    customers: "ग्राहक",
    search: "ग्राहक का नाम खोजें",
    searchPlaceholder: "नाम लिखें…",
    saveAll: "सभी सेव करें",
    savingAll: "सेव हो रहा है…",
    chooseQuantity: "या सही मात्रा चुनें",
    rate: "दूध का भाव",
    perLiter: "प्रति लीटर",
    save: "दर्ज करें",
    update: "बदलाव सेव करें",
    delete: "हटाएँ",
    recorded: "दर्ज हो गया",
    pending: "अभी दर्ज नहीं",
    loading: "रिकॉर्ड देख रहे हैं…",
    noCustomers: "कोई ग्राहक नहीं मिला",
    customerCount: "ग्राहक",
    deleteConfirm: (name, date) => `${name} की ${date} वाली दूध डिलीवरी हटाएँ?`,
    cleared: (name) => `${name} की डिलीवरी हटा दी गई।`,
    updated: (name) => `${name} की डिलीवरी अपडेट हो गई।`,
    saved: (name) => `${name} का दूध दर्ज हो गया।`,
    savedCount: (count) => `${count} रिकॉर्ड सेव हो गए।`,
    errorCustomers: "ग्राहक लोड नहीं हो पाए।",
    errorDeliveries: "दूध की डिलीवरी लोड नहीं हो पाई।",
    errorSave: "डिलीवरी सेव नहीं हो पाई।",
    errorDelete: "डिलीवरी हटाई नहीं जा सकी।",
    noActiveCustomers: "अभी कोई सक्रिय ग्राहक नहीं है।",
    quick: "जल्दी चुनें",
  },
  en: {
    title: "Milk delivery",
    subtitle: "Record milk delivered to customers today",
    date: "Date",
    today: "Today",
    refresh: "Refresh",
    morning: "Morning milk",
    evening: "Evening milk",
    total: "Total milk",
    customers: "Customers",
    search: "Find a customer",
    searchPlaceholder: "Type a name…",
    saveAll: "Save all",
    savingAll: "Saving…",
    chooseQuantity: "Or choose exact quantity",
    rate: "Milk rate",
    perLiter: "per litre",
    save: "Record milk",
    update: "Save changes",
    delete: "Delete",
    recorded: "Recorded",
    pending: "Not recorded",
    loading: "Loading records…",
    noCustomers: "No customers found",
    customerCount: "customers",
    deleteConfirm: (name, date) => `Delete the milk delivery for ${name} on ${date}?`,
    cleared: (name) => `Delivery cleared for ${name}.`,
    updated: (name) => `Delivery updated for ${name}.`,
    saved: (name) => `Milk recorded for ${name}.`,
    savedCount: (count) => `${count} record(s) saved.`,
    errorCustomers: "Unable to load customers.",
    errorDeliveries: "Unable to load deliveries.",
    errorSave: "Unable to save delivery.",
    errorDelete: "Unable to delete delivery.",
    noActiveCustomers: "No active customers found.",
    quick: "Quick select",
  },
};

const normalizeDate = (value) => {
  if (!value) return "";

  return new Date(value).toISOString().split("T")[0];
};

function MilkDelivery() {
  const [date, setDate] = useState(getToday());
  const [language, setLanguage] = useState(() => localStorage.getItem("dairy-app-language") || "hi");
  const [search, setSearch] = useState("");
  const t = COPY[language] || COPY.hi;

  const [customers, setCustomers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);

  /*
   * ---------------------------------------------------------
   * Load customers
   * ---------------------------------------------------------
   */

  const loadCustomers = async () => {
    try {
      const response = await getActiveCustomersApi();

      const data = Array.isArray(response)
        ? response
        : response?.customers || [];

      setCustomers(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t.errorCustomers,
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * Load deliveries for selected date
   * ---------------------------------------------------------
   */

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await getMilkDeliveriesApi({
        date,
      });

      const data = Array.isArray(response)
        ? response
        : response?.deliveries || [];

      setDeliveries(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t.errorDeliveries,
      );

      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const syncLanguage = (event) => {
      setLanguage(event.detail || localStorage.getItem("dairy-app-language") || "hi");
    };
    window.addEventListener("dairy-language-change", syncLanguage);
    return () => window.removeEventListener("dairy-language-change", syncLanguage);
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [date]);

  /*
   * ---------------------------------------------------------
   * Build daily rows
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const deliveryMap = new Map();

    deliveries.forEach((delivery) => {
      const customerId =
        delivery.customerId?._id ||
        delivery.customerId ||
        delivery.customer?._id;

      if (customerId) {
        deliveryMap.set(String(customerId), delivery);
      }
    });

    const nextRows = customers.map((customer) => {
      const customerId = String(customer._id);

      const existing = deliveryMap.get(customerId);

      return {
        customerId,

        customer,

        deliveryId: existing?._id || existing?.id || null,

        morning: Number(existing?.morning || 0),

        evening: Number(existing?.evening || 0),

        ratePerLiter: Number(existing?.ratePerLiter ?? customer.ratePerLiter ?? 75),

        existing: Boolean(existing),
      };
    });

    setRows(nextRows);
  }, [customers, deliveries]);

  /*
   * ---------------------------------------------------------
   * Update row quantity
   * ---------------------------------------------------------
   */

  const updateRow = (customerId, field, value) => {
    setRows((current) =>
      current.map((row) => {
        if (row.customerId !== customerId) {
          return row;
        }

        return {
          ...row,
          [field]: Number(value),
        };
      }),
    );
  };

  /*
   * ---------------------------------------------------------
   * Totals
   * ---------------------------------------------------------
   */

  const totalLiters = useMemo(() => {
    return rows.reduce(
      (sum, row) => sum + Number(row.morning || 0) + Number(row.evening || 0),
      0,
    );
  }, [rows]);

  const morningTotal = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.morning || 0), 0);
  }, [rows]);

  const eveningTotal = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.evening || 0), 0);
  }, [rows]);

  /*
   * ---------------------------------------------------------
   * Save one customer's delivery
   * ---------------------------------------------------------
   */

  const saveRow = async (row) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setEditingId(row.customerId);

      const morning = Number(row.morning || 0);
      const evening = Number(row.evening || 0);

      /*
       * Nothing selected.
       *
       * If an existing delivery is present and both
       * quantities become zero, delete it instead.
       */

      if (morning === 0 && evening === 0) {
        if (row.deliveryId) {
          await deleteMilkDeliveryApi(row.deliveryId);
        }

        await loadDeliveries();

        setSuccess(t.cleared(row.customer.name));

        return;
      }

      const payload = {
        customerId: row.customerId,
        date,
        morning,
        evening,
        ...(row.deliveryId ? { ratePerLiter: Number(row.ratePerLiter || row.customer.ratePerLiter || 75) } : {}),
      };

      if (row.deliveryId) {
        await updateMilkDeliveryApi(row.deliveryId, payload);

        setSuccess(t.updated(row.customer.name));
      } else {
        await createMilkDeliveryApi(payload);

        setSuccess(t.saved(row.customer.name));
      }

      await loadDeliveries();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t.errorSave,
      );
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * Save all changed rows
   * ---------------------------------------------------------
   */

  const saveAll = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let saved = 0;

      for (const row of rows) {
        const morning = Number(row.morning || 0);
        const evening = Number(row.evening || 0);

        if (morning === 0 && evening === 0 && !row.deliveryId) {
          continue;
        }

        const payload = {
          customerId: row.customerId,
          date,
          morning,
          evening,
          ...(row.deliveryId ? { ratePerLiter: Number(row.ratePerLiter || row.customer.ratePerLiter || 75) } : {}),
        };

        if (row.deliveryId) {
          await updateMilkDeliveryApi(row.deliveryId, payload);
        } else {
          await createMilkDeliveryApi(payload);
        }

        saved++;
      }

      await loadDeliveries();

      setSuccess(t.savedCount(saved));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save deliveries.",
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * Delete delivery
   * ---------------------------------------------------------
   */

  const deleteDelivery = async (row) => {
    if (!row.deliveryId) return;

    const confirmed = window.confirm(
      t.deleteConfirm(row.customer.name, date),
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await deleteMilkDeliveryApi(row.deliveryId);

      await loadDeliveries();

      setSuccess(`${row.customer.name} delivery deleted.`);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t.errorDelete,
      );
    } finally {
      setSaving(false);
    }
  };

  const visibleRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return rows;
    return rows.filter((row) => String(row.customer?.name || "").toLocaleLowerCase().includes(query));
  }, [rows, search]);

  const setQuantity = (customerId, field, value) => updateRow(customerId, field, value);

  const renderQuantityControl = (row, field, label) => (
    <div className="farmer-quantity-block">
      <div className="farmer-quantity-heading">{label}</div>
      <div className="farmer-quick-quantities" role="group" aria-label={label}>
        {QUICK_QUANTITIES.map((quantity) => (
          <button
            key={quantity}
            type="button"
            className={`farmer-quantity-chip ${Number(row[field]) === quantity ? "is-selected" : ""}`}
            aria-pressed={Number(row[field]) === quantity}
            onClick={() => setQuantity(row.customerId, field, quantity)}
          >
            {quantity === 0 ? "0" : `${quantity} L`}
          </button>
        ))}
      </div>
      <Form.Select
        className="farmer-exact-quantity"
        size="lg"
        value={row[field]}
        aria-label={`${label} — ${t.chooseQuantity}`}
        onChange={(event) => setQuantity(row.customerId, field, event.target.value)}
      >
        {QUANTITIES.map((quantity) => (
          <option key={quantity.value} value={quantity.value}>
            {quantity.label}
          </option>
        ))}
      </Form.Select>
    </div>
  );

  return (
    <div className="container-fluid farmer-delivery-page">
      <div className="farmer-delivery-hero">
        <div className="farmer-delivery-hero-copy">
          <span className="farmer-eyebrow">{language === "hi" ? "आज का काम" : "TODAY'S WORK"}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="farmer-delivery-date">
          <Form.Label htmlFor="milk-delivery-date">{t.date}</Form.Label>
          <Form.Control
            id="milk-delivery-date"
            type="date"
            size="lg"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Button variant="light" onClick={() => setDate(getToday())}>
            {t.today}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      <Row className="g-3 farmer-delivery-summary">
        <Col xs={12} sm={4}>
          <Card className="farmer-summary-card morning-summary h-100"><Card.Body>
            <div className="farmer-summary-icon" aria-hidden="true">🌅</div>
            <div className="farmer-summary-label">{t.morning}</div>
            <div className="farmer-summary-value">{formatLiters(morningTotal)}</div>
          </Card.Body></Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card className="farmer-summary-card evening-summary h-100"><Card.Body>
            <div className="farmer-summary-icon" aria-hidden="true">🌇</div>
            <div className="farmer-summary-label">{t.evening}</div>
            <div className="farmer-summary-value">{formatLiters(eveningTotal)}</div>
          </Card.Body></Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card className="farmer-summary-card total-summary h-100"><Card.Body>
            <div className="farmer-summary-icon" aria-hidden="true">🥛</div>
            <div className="farmer-summary-label">{t.total}</div>
            <div className="farmer-summary-value">{formatLiters(totalLiters)}</div>
          </Card.Body></Card>
        </Col>
      </Row>

      <div className="farmer-delivery-toolbar">
        <div>
          <h2>{t.customers}</h2>
          <p>{visibleRows.length} {t.customerCount} · {date}</p>
        </div>
        <div className="farmer-delivery-toolbar-actions">
          <Form.Control
            className="farmer-customer-search"
            type="search"
            size="lg"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.search}
          />
          <Button className="farmer-save-all" size="lg" onClick={saveAll} disabled={saving || rows.length === 0}>
            {saving ? <><Spinner size="sm" animation="border" className="me-2" />{t.savingAll}</> : t.saveAll}
          </Button>
          <Button variant="outline-secondary" size="lg" onClick={loadDeliveries} disabled={loading} aria-label={t.refresh}>
            {loading ? <Spinner size="sm" animation="border" /> : "↻"} <span className="farmer-refresh-label">{t.refresh}</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="farmer-delivery-empty"><Spinner animation="border" /><p>{t.loading}</p></div>
      ) : visibleRows.length === 0 ? (
        <div className="farmer-delivery-empty"><span aria-hidden="true">🔎</span><h3>{t.noCustomers}</h3></div>
      ) : (
        <div className="farmer-customer-card-list">
          {visibleRows.map((row, index) => (
            <Card className="farmer-customer-card" key={row.customerId}>
              <Card.Body>
                <div className="farmer-customer-card-top">
                  <div className="farmer-customer-identity">
                    <div className="farmer-customer-avatar" aria-hidden="true">{String(row.customer.name || "?").trim().charAt(0).toLocaleUpperCase()}</div>
                    <div>
                      <div className="farmer-customer-number">{language === "hi" ? `ग्राहक ${index + 1}` : `CUSTOMER ${index + 1}`}</div>
                      <h3>{row.customer.name}</h3>
                      <div className="farmer-customer-rate">{t.rate}: <strong>₹{Number(row.ratePerLiter || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong> / {t.perLiter}</div>
                    </div>
                  </div>
                  <Badge bg={row.existing ? "success" : "secondary"} className="farmer-delivery-status">
                    {row.existing ? t.recorded : t.pending}
                  </Badge>
                </div>

                <Row className="g-4 farmer-customer-quantities">
                  <Col xs={12} lg={6}>{renderQuantityControl(row, "morning", t.morning)}</Col>
                  <Col xs={12} lg={6}>{renderQuantityControl(row, "evening", t.evening)}</Col>
                </Row>

                <div className="farmer-customer-card-bottom">
                  <div className="farmer-customer-total">
                    <span>{language === "hi" ? "आज कुल" : "Today's total"}</span>
                    <strong>{formatLiters(Number(row.morning || 0) + Number(row.evening || 0))}</strong>
                  </div>
                  <div className="farmer-customer-actions">
                    {row.existing && (
                      <Button variant="outline-danger" size="lg" onClick={() => deleteDelivery(row)} disabled={saving}>
                        {t.delete}
                      </Button>
                    )}
                    <Button className="farmer-record-button" size="lg" onClick={() => saveRow(row)} disabled={saving && editingId === row.customerId}>
                      {saving && editingId === row.customerId ? <Spinner size="sm" animation="border" /> : row.existing ? t.update : t.save}
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && <div className="farmer-delivery-empty">{t.noActiveCustomers}</div>}
    </div>
  );
}

export default MilkDelivery;
