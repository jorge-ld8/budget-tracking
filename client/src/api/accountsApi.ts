// src/api/accountsApi.js
import axios from 'axios';

const BASE_URL = '/api/accounts';

export const accountsApi = {
  // Read all accounts
  getAll: async () => {
    const response = await axios.get(BASE_URL);
    return response.data;
  },
  
  // Read single account
  getById: async (id: string) => {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  },
  
  // Create new account
  create: async (accountData: any) => {
    const response = await axios.post(BASE_URL, accountData);
    return response.data;
  },
  
  // Update existing account
  update: async (id: string, accountData: any) => {
    const response = await axios.put(`${BASE_URL}/${id}`, accountData);
    return response.data;
  },
  
  // Delete account
  delete: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  }
};