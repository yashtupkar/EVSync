import axios from 'axios';

const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${backendURL}/api/bookings`;

// Helper to get token
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const getAvailableSlots = async (stationId, chargerId, date) => {
  return await axios.get(`${API_URL}/slots`, {
    params: { stationId, chargerId, date }
  });
};

export const createBooking = async (bookingData) => {
  return await axios.post(`${API_URL}/create`, bookingData, getAuthConfig());
};

export const confirmBooking = async (confirmationData) => {
  return await axios.post(`${API_URL}/confirm`, confirmationData, getAuthConfig());
};

export const getUserBookings = async () => {
  return await axios.get(`${API_URL}/my-bookings`, getAuthConfig());
};
