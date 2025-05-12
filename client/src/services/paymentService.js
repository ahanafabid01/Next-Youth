import API_BASE_URL from '../utils/apiConfig';
import axios from "axios";

// Make sure this matches your backend server address and port
const API_URL = `${API_BASE_URL}/payment`;

// Configure axios to always include credentials
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const paymentService = {
  // Payment methods
  getPaymentMethods: async () => {
    const response = await axiosInstance.get("/methods");
    return response.data;
  },
  
  addCardPaymentMethod: async (cardData) => {
    const response = await axiosInstance.post("/methods/card", cardData);
    return response.data;
  },
  
  addMobilePaymentMethod: async (mobileData) => {
    const response = await axiosInstance.post("/methods/mobile", mobileData);
    return response.data;
  },
  
  deletePaymentMethod: async (methodId) => {
    const response = await axiosInstance.delete(`/methods/${methodId}`);
    return response.data;
  },
  
  setDefaultPaymentMethod: async (methodId) => {
    const response = await axiosInstance.patch(`/methods/${methodId}/default`, {});
    return response.data;
  },
  
  // Transactions
  getPaymentHistory: async () => {
    const response = await axiosInstance.get("/history");
    return response.data;
  },
  
  createTransaction: async (transactionData) => {
    const response = await axiosInstance.post("/transaction", transactionData);
    return response.data;
  }
};

export default paymentService;