import api from './axios';

export const getMilkDeliveriesApi = async (params = {}) => {
  const response = await api.get('/milk-delivery', {
    params,
  });

  return response.data;
};

export const getMilkDeliveryApi = async (id) => {
  const response = await api.get(`/milk-delivery/${id}`);

  return response.data;
};

export const createMilkDeliveryApi = async (data) => {
  const response = await api.post('/milk-delivery', data);

  return response.data;
};

export const updateMilkDeliveryApi = async (id, data) => {
  const response = await api.put(
    `/milk-delivery/${id}`,
    data,
  );

  return response.data;
};

export const deleteMilkDeliveryApi = async (id) => {
  const response = await api.delete(
    `/milk-delivery/${id}`,
  );

  return response.data;
};