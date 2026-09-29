import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const safeNumber = (value) =>
  Number(value || 0);

const money = (value) =>
  `₹${safeNumber(value).toFixed(2)}`;

const liters = (value) =>
  `${safeNumber(value).toFixed(2)} L`;

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

/*
|--------------------------------------------------------------------------
| Excel
|--------------------------------------------------------------------------
*/

export const exportReportToExcel = ({
  reportType,
  report,
  date,
  year,
  month,
}) => {
  let headers = [];
  let rows = [];

  let title = 'Report';

  /*
   * Daily Production
   */

  if (reportType === 'daily-production') {
    title = 'Daily Production Report';

    headers = [
      'Metric',
      'Value',
    ];

    rows = [
      [
        'Date',
        date,
      ],
      [
        'Total Animals',
        report?.totalAnimals || 0,
      ],
      [
        'Animals Produced',
        report?.animalsProduced || 0,
      ],
      [
        'Morning Production (L)',
        safeNumber(report?.morningLiters),
      ],
      [
        'Evening Production (L)',
        safeNumber(report?.eveningLiters),
      ],
      [
        'Total Production (L)',
        safeNumber(report?.totalLiters),
      ],
    ];
  }

  /*
   * Monthly Production
   */

  else if (reportType === 'monthly-production') {
    title = 'Monthly Production Report';

    const animals =
      report?.animals ||
      report?.data ||
      report?.production ||
      [];

    headers = [
      'Animal',
      'Tag Number',
      'Morning (L)',
      'Evening (L)',
      'Total (L)',
      'Average / Day (L)',
    ];

    rows = animals.map((animal) => [
      animal.name || '-',
      animal.tagNumber || '-',
      safeNumber(animal.morningLiters),
      safeNumber(animal.eveningLiters),
      safeNumber(animal.totalLiters),
      safeNumber(animal.averagePerDay),
    ]);
  }

  /*
   * Customer Consumption
   */

  else if (
    reportType === 'customer-consumption'
  ) {
    title = 'Customer Consumption Report';

    const customers =
      report?.customers ||
      report?.data ||
      report?.consumption ||
      [];

    headers = [
      'Customer',
      'Mobile',
      'Morning (L)',
      'Evening (L)',
      'Total Milk (L)',
      'Amount',
    ];

    rows = customers.map((customer) => [
      customer.name ||
        customer.customer?.name ||
        '-',

      customer.mobile ||
        customer.customer?.mobile ||
        '-',

      safeNumber(customer.morningLiters),

      safeNumber(customer.eveningLiters),

      safeNumber(customer.totalLiters),

      safeNumber(
        customer.totalAmount ??
          customer.amount
      ),
    ]);
  }

  /*
   * Financial
   */

  else if (reportType === 'financial') {
    title = 'Financial Report';

    headers = [
      'Metric',
      'Amount',
    ];

    rows = [
      [
        'Total Billing',
        safeNumber(
          report?.totalBilling ??
            report?.totalAmount
        ),
      ],
      [
        'Total Collected',
        safeNumber(
          report?.totalCollected ??
            report?.totalPaid
        ),
      ],
      [
        'Total Pending',
        safeNumber(
          report?.totalPending
        ),
      ],
      [
        'Collection Rate (%)',
        safeNumber(
          report?.collectionRate
        ),
      ],
    ];
  }

  const worksheet = XLSX.utils.aoa_to_sheet([
    [title],
    [],
    headers,
    ...rows,
  ]);

  /*
   * Column widths
   */

  worksheet['!cols'] =
    headers.map((header) => ({
      wch: Math.max(
        15,
        String(header).length + 5
      ),
    }));

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Report'
  );

  const filename =
    `${reportType}-${date || `${year}-${month}`}.xlsx`;

  XLSX.writeFile(
    workbook,
    filename
  );
};

/*
|--------------------------------------------------------------------------
| PDF
|--------------------------------------------------------------------------
*/

export const exportReportToPDF = ({
  reportType,
  report,
  date,
  year,
  month,
}) => {
  const doc = new jsPDF({
    orientation:
      reportType ===
      'customer-consumption'
        ? 'landscape'
        : 'portrait',
  });

  let title = 'Report';

  let headers = [];
  let rows = [];

  /*
   * Daily Production
   */

  if (reportType === 'daily-production') {
    title = 'Daily Production Report';

    headers = [
      'Metric',
      'Value',
    ];

    rows = [
      [
        'Date',
        date,
      ],
      [
        'Total Animals',
        report?.totalAnimals || 0,
      ],
      [
        'Animals Produced',
        report?.animalsProduced || 0,
      ],
      [
        'Morning Production',
        liters(report?.morningLiters),
      ],
      [
        'Evening Production',
        liters(report?.eveningLiters),
      ],
      [
        'Total Production',
        liters(report?.totalLiters),
      ],
    ];
  }

  /*
   * Monthly Production
   */

  else if (reportType === 'monthly-production') {
    title = 'Monthly Production Report';

    const animals =
      report?.animals ||
      report?.data ||
      report?.production ||
      [];

    headers = [
      'Animal',
      'Tag Number',
      'Morning',
      'Evening',
      'Total',
      'Average / Day',
    ];

    rows = animals.map((animal) => [
      animal.name || '-',
      animal.tagNumber || '-',
      liters(animal.morningLiters),
      liters(animal.eveningLiters),
      liters(animal.totalLiters),
      liters(animal.averagePerDay),
    ]);
  }

  /*
   * Customer Consumption
   */

  else if (
    reportType ===
    'customer-consumption'
  ) {
    title = 'Customer Consumption Report';

    const customers =
      report?.customers ||
      report?.data ||
      report?.consumption ||
      [];

    headers = [
      'Customer',
      'Mobile',
      'Morning',
      'Evening',
      'Total Milk',
      'Amount',
    ];

    rows = customers.map((customer) => [
      customer.name ||
        customer.customer?.name ||
        '-',

      customer.mobile ||
        customer.customer?.mobile ||
        '-',

      liters(customer.morningLiters),

      liters(customer.eveningLiters),

      liters(customer.totalLiters),

      money(
        customer.totalAmount ??
          customer.amount
      ),
    ]);
  }

  /*
   * Financial
   */

  else if (reportType === 'financial') {
    title = 'Financial Report';

    headers = [
      'Metric',
      'Amount',
    ];

    rows = [
      [
        'Total Billing',
        money(
          report?.totalBilling ??
            report?.totalAmount
        ),
      ],
      [
        'Total Collected',
        money(
          report?.totalCollected ??
            report?.totalPaid
        ),
      ],
      [
        'Total Pending',
        money(
          report?.totalPending
        ),
      ],
      [
        'Collection Rate',
        `${safeNumber(
          report?.collectionRate
        ).toFixed(2)}%`,
      ],
    ];
  }

  doc.setFontSize(18);
  doc.text(title, 14, 18);

  doc.setFontSize(10);

  const period =
    reportType === 'daily-production'
      ? `Date: ${date}`
      : `Period: ${year}-${String(month).padStart(2, '0')}`;

  doc.text(period, 14, 26);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 34,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fontStyle: 'bold',
    },
  });

  const filename =
    `${reportType}-${date || `${year}-${month}`}.pdf`;

  doc.save(filename);
};

/*
|--------------------------------------------------------------------------
| Print
|--------------------------------------------------------------------------
*/

export const printReport = ({
  title,
  period,
  headers,
  rows,
}) => {
  const tableHead = headers
    .map(
      (header) =>
        `<th>${header}</th>`
    )
    .join('');

  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (value) =>
              `<td>${value ?? ''}</td>`
          )
          .join('')}</tr>`
    )
    .join('');

  const printWindow =
    window.open('', '_blank');

  if (!printWindow) {
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>

    <html>

    <head>

      <title>${title}</title>

      <style>

        body {
          font-family: Arial, sans-serif;
          padding: 30px;
        }

        h1 {
          margin-bottom: 5px;
        }

        .period {
          color: #666;
          margin-bottom: 25px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
        }

        th {
          font-weight: bold;
        }

        @media print {
          body {
            padding: 0;
          }
        }

      </style>

    </head>

    <body>

      <h1>${title}</h1>

      <div class="period">
        ${period}
      </div>

      <table>

        <thead>
          <tr>
            ${tableHead}
          </tr>
        </thead>

        <tbody>
          ${tableRows}
        </tbody>

      </table>

    </body>

    </html>
  `);

  printWindow.document.close();

  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
};