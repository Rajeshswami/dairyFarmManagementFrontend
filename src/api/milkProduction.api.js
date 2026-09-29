import api from './axios';

export const getMilkProductionApi = async (params = {}) => {
  const response = await api.get('/milk-production', {
    params,
  });

  return response.data;
};

export const getMilkProductionByIdApi = async (id) => {
  const response = await api.get(`/milk-production/${id}`);

  return response.data;
};

export const getMilkProductionByAnimalApi = async (animalId) => {
  const response = await api.get(
    `/milk-production/animal/${animalId}`,
  );

  return response.data;
};

export const getMilkProductionByDateApi = async (date) => {
  const response = await api.get(
    `/milk-production/date/${date}`,
  );

  return response.data;
};

export const createMilkProductionApi = async (data) => {
  const response = await api.post(
    '/milk-production',
    data,
  );

  return response.data;
};

export const updateMilkProductionApi = async (id, data) => {
  const response = await api.put(
    `/milk-production/${id}`,
    data,
  );

  return response.data;
};

export const deleteMilkProductionApi = async (id) => {
  const response = await api.delete(
    `/milk-production/${id}`,
  );

  return response.data;
};