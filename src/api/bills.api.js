import api from './axios';

export const generateMonthlyBillApi = async (
  customerId,
  year,
  month,
) => {
  const response = await api.post('/bills/generate', {
    customerId,
    year: Number(year),
    month: Number(month),
  });

  return response.data;
};

export const getMonthlyBillsApi = async (
  year,
  month,
) => {
  const response = await api.get('/bills/monthly', {
    params: {
      year: Number(year),
      month: Number(month),
    },
  });

  return response.data;
};

export const getPendingBillsApi = async (
  year,
  month,
) => {
  const response = await api.get('/bills/pending', {
    params: {
      year: Number(year),
      month: Number(month),
    },
  });

  return response.data;
};

export const getBillApi = async (id) => {
  const response = await api.get(`/bills/${id}`);

  return response.data;
};

export const getCustomerBillsApi = async (
  customerId,
) => {
  const response = await api.get(
    `/bills/customer/${customerId}`,
  );

  return response.data;
};