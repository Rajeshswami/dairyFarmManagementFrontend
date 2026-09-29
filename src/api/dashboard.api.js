import api from './axios';

export const getDashboardApi = async (year, month) => {
  const response = await api.get('/dashboard', {
    params: {
      year,
      month,
    },
  });

  return response.data;
};