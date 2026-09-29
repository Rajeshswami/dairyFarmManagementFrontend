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
  exportReportToExcel,
  exportReportToPDF,
  printReport,
} from "../../utils/reportExport";
import {
  getDailyProductionReportApi,
  getMonthlyProductionReportApi,
  getCustomerConsumptionReportApi,
  getFinancialReportApi,
} from "../../api/reports.api";
import { getFarmToday, getFarmYear, getFarmMonth } from "../../utils/farmDate";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getYears = () => {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 5 }, (_, index) => currentYear - index);
};

const formatMoney = (value) => `₹${Number(value || 0).toFixed(2)}`;

const formatNumber = (value) => Number(value || 0).toFixed(2);

function SummaryCard({ title, value, subtitle }) {
  return (
    <Card className="h-100 shadow-sm border-0">
      <Card.Body>
        <div className="text-muted small mb-2">{title}</div>

        <div className="fs-4 fw-bold">{value}</div>

        {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
      </Card.Body>
    </Card>
  );
}

function Reports() {
  const [activeReport, setActiveReport] = useState("daily-production");

  const [date, setDate] = useState(getFarmToday());

  const [year, setYear] = useState(getFarmYear());

  const [month, setMonth] = useState(getFarmMonth());

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const years = useMemo(() => getYears(), []);
  const buildExportData = () => {
    let title = "Report";
    let headers = [];
    let rows = [];

    if (activeReport === "daily-production") {
      title = "Daily Production Report";

      headers = ["Metric", "Value"];
      const summary = report?.summary || {};
      rows = [
        ["Date", date],
        ["Total Animals", summary.totalAnimals || 0],
        ["Animals Produced", summary.animalsProduced || 0],
        [
          "Morning Production",
          `${Number(summary.morningLiters || 0).toFixed(2)} L`,
        ],
        [
          "Evening Production",
          `${Number(summary.eveningLiters || 0).toFixed(2)} L`,
        ],
        [
          "Total Production",
          `${Number(summary.totalLiters || 0).toFixed(2)} L`,
        ],
      ];
    }

    if (activeReport === "monthly-production") {
      title = "Monthly Production Report";

      headers = [
        "Animal",
        "Tag Number",
        "Morning",
        "Evening",
        "Total",
        "Average / Day",
      ];

      const animals =
        report?.animals || report?.data || report?.production || [];

      rows = animals.map((animal) => [
        animal.name || "-",
        animal.tagNumber || "-",
        `${Number(animal.morningLiters || 0).toFixed(2)} L`,
        `${Number(animal.eveningLiters || 0).toFixed(2)} L`,
        `${Number(animal.totalLiters || 0).toFixed(2)} L`,
        `${Number(animal.averagePerDay || 0).toFixed(2)} L`,
      ]);
    }

    if (activeReport === "customer-consumption") {
      title = "Customer Consumption Report";

      headers = [
        "Customer",
        "Mobile",
        "Morning",
        "Evening",
        "Total Milk",
        "Amount",
      ];

      const customers =
        report?.customers || report?.data || report?.consumption || [];

      rows = customers.map((customer) => [
        customer.name || customer.customer?.name || "-",

        customer.mobile || customer.customer?.mobile || "-",

        `${Number(customer.morningLiters || 0).toFixed(2)} L`,

        `${Number(customer.eveningLiters || 0).toFixed(2)} L`,

        `${Number(customer.totalLiters || 0).toFixed(2)} L`,

        `₹${Number(customer.totalAmount ?? customer.amount ?? 0).toFixed(2)}`,
      ]);
    }

    if (activeReport === "financial") {
      title = "Financial Report";

      headers = ["Metric", "Amount"];

      const summary = report?.summary || {};

      rows = [
        [
          "Total Billing",
          `₹${Number(summary.totalBilling ?? summary.totalAmount ?? 0).toFixed(
            2,
          )}`,
        ],
        [
          "Total Collected",
          `₹${Number(summary.totalCollected ?? summary.totalPaid ?? 0).toFixed(
            2,
          )}`,
        ],
        ["Total Pending", `₹${Number(summary.totalPending || 0).toFixed(2)}`],
        [
          "Collection Rate",
          `${Number(summary.collectionRate || 0).toFixed(2)}%`,
        ],
      ];
    }

    return {
      title,
      headers,
      rows,
    };
  };

  const handlePrint = () => {
    if (!report) return;

    const { title, headers, rows } = buildExportData();

    const period =
      activeReport === "daily-production"
        ? `Date: ${date}`
        : `Period: ${year}-${String(month).padStart(2, "0")}`;

    printReport({
      title,
      period,
      headers,
      rows,
    });
  };

  const handlePDF = () => {
    if (!report) return;

    exportReportToPDF({
      reportType: activeReport,
      report,
      date,
      year,
      month,
    });
  };

  const handleExcel = () => {
    if (!report) return;

    exportReportToExcel({
      reportType: activeReport,
      report,
      date,
      year,
      month,
    });
  };
  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");
      setReport(null);

      let result;

      switch (activeReport) {
        case "daily-production":
          result = await getDailyProductionReportApi(date);
          break;

        case "monthly-production":
          result = await getMonthlyProductionReportApi(year, month);
          break;

        case "customer-consumption":
          result = await getCustomerConsumptionReportApi(year, month);
          break;

        case "financial":
          result = await getFinancialReportApi(year, month);
          break;

        default:
          result = null;
      }

      setReport(result);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load report.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport, date, year, month]);

  const renderDailyProduction = () => {
    if (!report) return null;

    const summary = report.summary || {};

    return (
      <>
        <Row className="g-3 mb-4">
          <Col md={3}>
            <SummaryCard
              title="Total Animals"
              value={summary.totalAnimals || 0}
            />
          </Col>

          <Col md={3}>
            <SummaryCard
              title="Animals Produced"
              value={summary.animalsProduced || 0}
            />
          </Col>

          <Col md={3}>
            <SummaryCard
              title="Morning Milk"
              value={`${formatNumber(summary.morningLiters)} L`}
            />
          </Col>

          <Col md={3}>
            <SummaryCard
              title="Evening Milk"
              value={`${formatNumber(summary.eveningLiters)} L`}
            />
          </Col>
        </Row>

        <Card className="shadow-sm border-0">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-1">Daily Production</h5>
                <div className="text-muted">{date}</div>
              </div>

              <Badge bg="success">{formatNumber(summary.totalLiters)} L</Badge>
            </div>

            <Table responsive hover>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="text-end">Value</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Total Animals</td>
                  <td className="text-end">{summary.totalAnimals || 0}</td>
                </tr>

                <tr>
                  <td>Animals Produced</td>
                  <td className="text-end">{summary.animalsProduced || 0}</td>
                </tr>

                <tr>
                  <td>Morning Production</td>
                  <td className="text-end">
                    {formatNumber(summary.morningLiters)} L
                  </td>
                </tr>

                <tr>
                  <td>Evening Production</td>
                  <td className="text-end">
                    {formatNumber(summary.eveningLiters)} L
                  </td>
                </tr>

                <tr className="fw-bold">
                  <td>Total Production</td>
                  <td className="text-end">
                    {formatNumber(summary.totalLiters)} L
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </>
    );
  };

  const renderMonthlyProduction = () => {
    if (!report) return null;

    const animals = report.animals || report.data || report.production || [];

    return (
      <>
        <Row className="g-3 mb-4">
          <Col md={4}>
            <SummaryCard
              title="Month"
              value={MONTHS[month - 1]}
              subtitle={year}
            />
          </Col>

          <Col md={4}>
            <SummaryCard
              title="Total Production"
              value={`${formatNumber(report.totalLiters)} L`}
            />
          </Col>

          <Col md={4}>
            <SummaryCard title="Animals" value={animals.length} />
          </Col>
        </Row>

        <Card className="shadow-sm border-0">
          <Card.Body>
            <h5 className="mb-3">Monthly Production by Animal</h5>

            {animals.length === 0 ? (
              <div className="text-muted text-center py-4">
                No production data found.
              </div>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Animal</th>
                    <th>Tag Number</th>
                    <th>Morning</th>
                    <th>Evening</th>
                    <th>Total</th>
                    <th>Average / Day</th>
                  </tr>
                </thead>

                <tbody>
                  {animals.map((animal, index) => (
                    <tr key={animal.animalId || animal._id || index}>
                      <td>{animal.name || "-"}</td>

                      <td>{animal.tagNumber || "-"}</td>

                      <td>{formatNumber(animal.morningLiters)} L</td>

                      <td>{formatNumber(animal.eveningLiters)} L</td>

                      <td className="fw-semibold">
                        {formatNumber(animal.totalLiters)} L
                      </td>

                      <td>{formatNumber(animal.averagePerDay)} L</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </>
    );
  };

  const renderCustomerConsumption = () => {
    if (!report) return null;

    const customers =
      report.customers || report.data || report.consumption || [];

    return (
      <>
        <Row className="g-3 mb-4">
          <Col md={4}>
            <SummaryCard title="Customers" value={customers.length} />
          </Col>

          <Col md={4}>
            <SummaryCard
              title="Total Milk"
              value={`${formatNumber(report.totalLiters)} L`}
            />
          </Col>

          <Col md={4}>
            <SummaryCard
              title="Total Amount"
              value={formatMoney(report.totalAmount)}
            />
          </Col>
        </Row>

        <Card className="shadow-sm border-0">
          <Card.Body>
            <h5 className="mb-3">Customer Consumption</h5>

            {customers.length === 0 ? (
              <div className="text-muted text-center py-4">
                No customer consumption data found.
              </div>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Mobile</th>
                    <th>Morning</th>
                    <th>Evening</th>
                    <th>Total Milk</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={customer.customerId || customer._id || index}>
                      <td>{customer.name || customer.customer?.name || "-"}</td>

                      <td>
                        {customer.mobile || customer.customer?.mobile || "-"}
                      </td>

                      <td>{formatNumber(customer.morningLiters)} L</td>

                      <td>{formatNumber(customer.eveningLiters)} L</td>

                      <td className="fw-semibold">
                        {formatNumber(customer.totalLiters)} L
                      </td>

                      <td>
                        {formatMoney(customer.totalAmount ?? customer.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </>
    );
  };

  const renderFinancial = () => {
    if (!report) return null;
    const summary = report?.summary || {};
    return (
      <>
        <Row className="g-3 mb-4">
          <Col md={3}>
            <SummaryCard
              title="Total Billing"
              value={formatMoney(summary.totalBilling ?? summary.totalBilling)}
            />
          </Col>

          <Col md={3}>
            <SummaryCard
              title="Collected"
              value={formatMoney(summary.totalCollected ?? summary.totalPaid)}
            />
          </Col>

          <Col md={3}>
            <SummaryCard
              title="Pending"
              value={formatMoney(summary.totalPending)}
            />
          </Col>

          <Col md={3}>
            <SummaryCard
              title="Collection Rate"
              value={`${Number(summary.collectionRate || 0).toFixed(2)}%`}
            />
          </Col>
        </Row>

        <Card className="shadow-sm border-0">
          <Card.Body>
            <h5 className="mb-3">Financial Summary</h5>

            <Table responsive hover>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Total Billing</td>
                  <td className="text-end">
                    {formatMoney(summary.totalBilling ?? summary.totalAmount)}
                  </td>
                </tr>

                <tr>
                  <td>Total Collected</td>
                  <td className="text-end">
                    {formatMoney(summary.totalCollected ?? summary.totalPaid)}
                  </td>
                </tr>

                <tr>
                  <td>Total Pending</td>
                  <td className="text-end">
                    {formatMoney(summary.totalPending)}
                  </td>
                </tr>

                <tr className="fw-bold">
                  <td>Collection Rate</td>
                  <td className="text-end">
                    {Number(summary.collectionRate || 0).toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </>
    );
  };

  const renderReport = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <div className="text-muted mt-2">Loading report...</div>
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    if (!report) {
      return (
        <div className="text-muted text-center py-5">
          No report data available.
        </div>
      );
    }

    switch (activeReport) {
      case "daily-production":
        return renderDailyProduction();

      case "monthly-production":
        return renderMonthlyProduction();

      case "customer-consumption":
        return renderCustomerConsumption();

      case "financial":
        return renderFinancial();

      default:
        return null;
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Reports</h2>
          <div className="text-muted">
            Farm production, customer consumption and financial reports
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant={
                activeReport === "daily-production"
                  ? "primary"
                  : "outline-primary"
              }
              onClick={() => setActiveReport("daily-production")}
            >
              Daily Production
            </Button>

            <Button
              variant={
                activeReport === "monthly-production"
                  ? "primary"
                  : "outline-primary"
              }
              onClick={() => setActiveReport("monthly-production")}
            >
              Monthly Production
            </Button>

            <Button
              variant={
                activeReport === "customer-consumption"
                  ? "primary"
                  : "outline-primary"
              }
              onClick={() => setActiveReport("customer-consumption")}
            >
              Customer Consumption
            </Button>

            <Button
              variant={
                activeReport === "financial" ? "primary" : "outline-primary"
              }
              onClick={() => setActiveReport("financial")}
            >
              Financial
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="align-items-end g-3">
            {activeReport === "daily-production" ? (
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Production Date</Form.Label>

                  <Form.Control
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
            ) : (
              <>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Year</Form.Label>

                    <Form.Select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                    >
                      {years.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Month</Form.Label>

                    <Form.Select
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                    >
                      {MONTHS.map((item, index) => (
                        <option key={item} value={index + 1}>
                          {item}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </>
            )}

            <Col md="auto">
              <Button variant="primary" onClick={loadReport} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Loading...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      {report && !loading && !error && (
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="outline-secondary" onClick={handlePrint}>
                Print
              </Button>

              <Button variant="outline-danger" onClick={handlePDF}>
                PDF
              </Button>

              <Button variant="outline-success" onClick={handleExcel}>
                Excel
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
      {renderReport()}
    </div>
  );
}

export default Reports;
