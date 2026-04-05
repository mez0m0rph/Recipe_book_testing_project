import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5116/api', 
});

export const getProducts = () => API.get('/products');
export const getProduct = (id) => API.get(`/products/${id}`);
export const createProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

export const getDishes = () => API.get('/dishes');
export const getDish = (id) => API.get(`/dishes/${id}`);
export const createDish = (data) => API.post('/dishes', data);
export const updateDish = (id, data) => API.put(`/dishes/${id}`, data);
export const deleteDish = (id) => API.delete(`/dishes/${id}`);