import api from './axios';

export const createPaymentApi = async (data) => {
  const response = await api.post('/payments', data);
  return response.data;
};

export const getPaymentApi = async (id) => {
  const response = await api.get(`/payments/${id}`);
  return response.data;
};

export const getCustomerPaymentsApi = async (customerId) => {
  const response = await api.get(
    `/payments/customer/${customerId}`
  );
  return response.data;
};

export const updatePaymentApi = async (id, data) => {
  const response = await api.put(`/payments/${id}`, data);
  return response.data;
};

export const deletePaymentApi = async (id) => {
  const response = await api.delete(`/payments/${id}`);
  return response.data;
};