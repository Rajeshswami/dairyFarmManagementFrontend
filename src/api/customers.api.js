import api from './axios';

export const getCustomersApi = async () => {
  const response = await api.get('/customers');
  return response.data;
};

export const getDefaultMilkRateApi = async () => {
  const response = await api.get('/customers/default-rate');
  return response.data;
};

export const getActiveCustomersApi = async () => {
  const response = await api.get('/customers/active');
  return response.data;
};

export const getCustomerApi = async (id) => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

export const createCustomerApi = async (data) => {
  const response = await api.post('/customers', data);
  return response.data;
};

export const updateCustomerApi = async (id, data) => {
  const response = await api.put(
    `/customers/${id}`,
    data
  );

  return response.data;
};

export const activateCustomerApi = async (id) => {
  const response = await api.patch(
    `/customers/${id}/activate`
  );

  return response.data;
};

export const deactivateCustomerApi = async (id) => {
  const response = await api.patch(
    `/customers/${id}/deactivate`
  );

  return response.data;
};