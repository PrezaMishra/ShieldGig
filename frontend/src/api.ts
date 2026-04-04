import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const workerAPI = {
  register: (data: any) => api.post('/register', data),
  getWorker: (phone: string) => api.get(`/workers/${phone}`),
  updateIncome: (workerId: number, daily_income: number) =>
    api.patch(`/workers/${workerId}/income`, null, { params: { daily_income } }),
};

export const policyAPI = {
  calculatePremium: (location: string, daily_income: number) =>
    api.get('/premium/calculate', { params: { location, daily_income } }),
  createPolicy: (data: any) => api.post('/policies/create', data),
  getActivePolicy: (workerId: number) => api.get(`/policies/active/${workerId}`),
};

export const claimAPI = {
  getClaims: (workerId: number) => api.get(`/claims/${workerId}`),
};

export const adminAPI = {
  triggerEvent: (data: any) => api.post('/admin/trigger-weather-event', data),
};

export const riskAPI = {
  getRiskAssessment: (location: string) => api.get(`/risk-assessment/${encodeURIComponent(location)}`),
};

export const trustAPI = {
  getTrustScore: (workerId: number) => api.get(`/trust-score/${workerId}`),
};

export const fraudAPI = {
  getSummary: () => api.get('/fraud-detection/summary'),
};
