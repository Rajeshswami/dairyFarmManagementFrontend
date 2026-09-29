import api from './axios';

export const getAnimalsApi = async () => {
  const response = await api.get('/animals');
  return response.data;
};

export const getActiveAnimalsApi = async () => {
  const response = await api.get('/animals/active');
  return response.data;
};

export const getAnimalApi = async (id) => {
  const response = await api.get(`/animals/${id}`);
  return response.data;
};

export const createAnimalApi = async (data) => {
  const response = await api.post('/animals', data);
  return response.data;
};

export const updateAnimalApi = async (id, data) => {
  const response = await api.put(`/animals/${id}`, data);
  return response.data;
};

export const updateAnimalStatusApi = async (id, status) => {
  const response = await api.patch(`/animals/${id}/status/${status}`);
  return response.data;
};