import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
});

const getAuthConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getNearbyStations = (lng, lat) => api.get(`/api/stations/nearby?lng=${lng}&lat=${lat}`);
export const getStationById = (id) => api.get(`/api/stations/${id}`);
export const getAllStations = () => api.get('/api/stations');
export const createStation = (stationData) => api.post('/api/stations', stationData);

export const getAllUsers = (token) => api.get('/api/admin/users', getAuthConfig(token));
export const getPendingStationRequests = (token) =>
  api.get('/api/admin/pending-stations', getAuthConfig(token));
export const getAllStationRequests = (token) =>
  api.get('/api/admin/all-stations', getAuthConfig(token));
export const approveStationRequest = (stationId, token) =>
  api.post(`/api/admin/approve/${stationId}`, {}, getAuthConfig(token));
export const rejectStationRequest = (stationId, reason, token) =>
  api.post(`/api/admin/reject/${stationId}`, { reason }, getAuthConfig(token));

// Image Upload
export const uploadStationImage = (formData, token) =>
  api.post('/api/upload/station-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    }
  });

// Admin Station CRUD
export const createAdminStation = (stationData, token) =>
  api.post('/api/admin/station', stationData, getAuthConfig(token));
export const updateAdminStation = (stationId, stationData, token) =>
  api.put(`/api/admin/station/${stationId}`, stationData, getAuthConfig(token));
export const deleteAdminStation = (stationId, token) =>
  api.delete(`/api/admin/station/${stationId}`, getAuthConfig(token));

export default api;
