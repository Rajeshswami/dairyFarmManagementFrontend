import api from './axios';

export const loginApi = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });

  return response.data;
};

export const getMeApi = async () => {
  const response = await api.get('/auth/me');

  return response.data;
};

export const logoutApi = async () => {
  const response = await api.post('/auth/logout');

  return response.data;
};