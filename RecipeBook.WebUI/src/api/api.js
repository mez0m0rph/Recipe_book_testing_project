import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5116/api"
});

export const uploadFiles = async (files) => {
    const formData = new FormData();

    for (const file of files) {
        formData.append("files", file);
    }

    const response = await api.post("/uploads", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return response.data;
};

export const getProducts = async (params = {}) => {
    const response = await api.get("/products", { params });
    return response.data;
};

export const getProduct = async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

export const createProduct = async (product) => {
    const response = await api.post("/products", product);
    return response.data;
};

export const updateProduct = async (id, product) => {
    const response = await api.put(`/products/${id}`, product);
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};

export const getDishes = async (params = {}) => {
    const response = await api.get("/dishes", { params });
    return response.data;
};

export const getDish = async (id) => {
    const response = await api.get(`/dishes/${id}`);
    return response.data;
};

export const createDish = async (dish) => {
    const response = await api.post("/dishes", dish);
    return response.data;
};

export const updateDish = async (id, dish) => {
    const response = await api.put(`/dishes/${id}`, dish);
    return response.data;
};

export const deleteDish = async (id) => {
    const response = await api.delete(`/dishes/${id}`);
    return response.data;
};

export default api;