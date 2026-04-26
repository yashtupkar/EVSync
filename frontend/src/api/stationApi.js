import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
});

export const getNearbyStations = (lng, lat) => api.get(`/stations/nearby?lng=${lng}&lat=${lat}`);
export const getAllStations = () => api.get('/stations');
export const createStation = (stationData) => api.post('/stations', stationData);
export const getAllUsers = () => api.get('/stations/users');

export default api;
