import { useEffect, useState } from "react";
import { deleteProduct, getProducts } from "../api/api";
import { Link } from "react-router-dom";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState("");

    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить список продуктов.");
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id) => {
        try {
            await deleteProduct(id);
            await fetchProducts();
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || "Не удалось удалить продукт.");
        }
    };

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px"
                }}
            >
                <h2 style={{ margin: 0 }}>Продукты</h2>
                <Link to="/products/create">Добавить продукт</Link>
            </div>

            {error && (
                <div style={{ color: "red", marginBottom: "12px" }}>
                    {error}
                </div>
            )}

            {products.length === 0 ? (
                <p>Пока нет продуктов.</p>
            ) : (
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse"
                    }}
                >
                    <thead>
                        <tr>
                            <th style={cellHeaderStyle}>Название</th>
                            <th style={cellHeaderStyle}>Категория</th>
                            <th style={cellHeaderStyle}>Ккал</th>
                            <th style={cellHeaderStyle}>Б</th>
                            <th style={cellHeaderStyle}>Ж</th>
                            <th style={cellHeaderStyle}>У</th>
                            <th style={cellHeaderStyle}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td style={cellStyle}>{product.name}</td>
                                <td style={cellStyle}>{product.category}</td>
                                <td style={cellStyle}>{product.calories}</td>
                                <td style={cellStyle}>{product.proteins}</td>
                                <td style={cellStyle}>{product.fats}</td>
                                <td style={cellStyle}>{product.carbs}</td>
                                <td style={cellStyle}>
                                    <Link to={`/products/edit/${product.id}`}>
                                        Редактировать
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(product.id)}
                                        style={{ marginLeft: "10px" }}
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

const cellHeaderStyle = {
    textAlign: "left",
    borderBottom: "1px solid #ccc",
    padding: "8px"
};

const cellStyle = {
    borderBottom: "1px solid #eee",
    padding: "8px"
};