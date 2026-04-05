const API_URL = "http://localhost:5116/api"; // обязательно http!

export async function fetchProducts() {
    const res = await fetch(`${API_URL}/Product`);
    if (!res.ok) throw new Error("Failed to fetch products");
    return await res.json();
}

export async function fetchDishes() {
    const res = await fetch(`${API_URL}/Dish`);
    if (!res.ok) throw new Error("Failed to fetch dishes");
    return await res.json();
}