import api from './axios';

export const getDailyProductionReportApi = async (date) => {
  const response = await api.get('/reports/daily-production', {
    params: { date },
  });

  return response.data;
};

export const getMonthlyProductionReportApi = async (year, month) => {
  const response = await api.get('/reports/monthly-production', {
    params: {
      year: Number(year),
      month: Number(month),
    },
  });

  return response.data;
};

export const getCustomerConsumptionReportApi = async (year, month) => {
  const response = await api.get('/reports/customer-consumption', {
    params: {
      year: Number(year),
      month: Number(month),
    },
  });

  return response.data;
};

export const getFinancialReportApi = async (year, month) => {
  const response = await api.get('/reports/financial', {
    params: {
      year: Number(year),
      month: Number(month),
    },
  });

  return response.data;
};