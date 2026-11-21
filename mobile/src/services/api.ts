import axios from 'axios';
import { Platform } from 'react-native';

// Priority: EXPO_PUBLIC_API_URL > Platform Default
// Note: When testing on a physical mobile device, replace 127.0.0.1 with your LAN IP (e.g. 192.168.1.x)
const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

export const API_BASE_URL = getBaseUrl();

export const mobileApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let currentAuthToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentAuthToken = token;
  if (token) {
    mobileApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete mobileApi.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = () => currentAuthToken;

export const checkBackendHealth = async () => {
  try {
    const res = await mobileApi.get('/health');
    return { connected: true, data: res.data };
  } catch (error: any) {
    return { connected: false, error: error.message || 'Backend unreachable' };
  }
};
