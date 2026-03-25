import axios from 'axios';

import { setupInterceptors } from './apiInterceptors';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

setupInterceptors(api);

export default api;
