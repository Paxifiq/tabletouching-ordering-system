import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export const fetchMenu = (type) => axios.get(`${API_BASE}/api/menu`, { params: { type } }).then(res => res.data);
export const createCustomerCode = (tableNo) => axios.post(`${API_BASE}/api/customer-codes`, { table_no: tableNo }).then(res => res.data);
export const fetchCustomerCodes = () => axios.get(`${API_BASE}/api/customer-codes`, { params: { all: true } }).then(res => res.data);
export const createOrder = (payload) => axios.post(`${API_BASE}/api/orders`, payload).then(res => res.data);
export const fetchOrdersByCode = (customer_code) => axios.get(`${API_BASE}/api/orders`, { params: { customer_code } }).then(res => res.data);
export const recordPayment = (payload) => axios.post(`${API_BASE}/api/payments`, payload).then(res => res.data);
export const requestMomoPayment = (payload) => axios.post(`${API_BASE}/api/payments/momo/request`, payload).then(res => res.data);
export const verifyMomoPayment = (txRef, payload) => axios.post(`${API_BASE}/api/payments/momo/status/${txRef}`, payload).then(res => res.data);
export const fetchPayments = () => axios.get(`${API_BASE}/api/payments`).then(res => res.data);
export const fetchReports = () => axios.get(`${API_BASE}/api/reports`).then(res => res.data);
export const login = (payload) => axios.post(`${API_BASE}/api/auth/login`, payload).then(res => res.data);
export const fetchStaffOrders = (filter) => axios.get(`${API_BASE}/api/orders/all`, { params: filter }).then(res => res.data);
export const updateOrderItemStatus = (itemId, payload) => axios.post(`${API_BASE}/api/orders/item/${itemId}/status`, payload).then(res => res.data);
export const createMenuItem = (formData) => axios.post(`${API_BASE}/api/menu`, formData).then(res => res.data);
export const updateMenuItem = (id, formData) => axios.put(`${API_BASE}/api/menu/${id}`, formData).then(res => res.data);
export const deleteMenuItem = (id) => axios.delete(`${API_BASE}/api/menu/${id}`).then(res => res.data);
export const fetchUsers = () => axios.get(`${API_BASE}/api/users`).then(res => res.data);
export const createUser = (payload) => axios.post(`${API_BASE}/api/users`, payload).then(res => res.data);
