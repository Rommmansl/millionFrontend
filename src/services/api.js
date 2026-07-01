import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
});

export const getItems = (page, search = '', signal) =>
    api.get('/items', { params: { page, limit: 20, search }, signal });

export const getSelectedItems = (page, search = '', signal) =>
    api.get('/selected', { params: { page, limit: 20, search }, signal });

export const addItem = (id, name) =>
    api.post('/items', { id, name });

export const selectItem = (id) =>
    api.post(`/items/${id}/select`);

export const removeSelected = (id) =>
    api.delete(`/selected/${id}`);

export const updateOrder = (order) =>
    api.put('/selected/order', { order });

export const getState = () =>
    api.get('/state');