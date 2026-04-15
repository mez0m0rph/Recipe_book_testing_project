import { useEffect, useState } from "react";
import { getProduct } from "../api/api";
import { Link, useParams } from "react-router-dom";

export default function ProductView() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getProduct(id)
            .then(setProduct)
            .catch((err) => {
                console.error(err);
                setError("Не удалось загрузить продукт.");
            });
    }, [id]);

    if (error) {
        return <div style={{ color: "red" }}>{error}</div>;
    }

    if (!product) {
        return <div>Загрузка...</div>;
    }

    return (
        <div>
            <h2>{product.name}</h2>

            <p><strong>Категория:</strong> {product.category}</p>
            <p><strong>Необходимость готовки:</strong> {product.cookingType}</p>
            <p><strong>Калории:</strong> {product.calories}</p>
            <p><strong>Белки:</strong> {product.proteins}</p>
            <p><strong>Жиры:</strong> {product.fats}</p>
            <p><strong>Углеводы:</strong> {product.carbs}</p>
            <p><strong>Состав:</strong> {product.composition || "—"}</p>
            <p><strong>Флаги:</strong> {String(product.flags)}</p>

            <div style={{ marginTop: "16px" }}>
                <Link to={`/products/edit/${product.id}`}>Редактировать</Link>
                <Link to="/products" style={{ marginLeft: "12px" }}>Назад</Link>
            </div>
        </div>
    );
}