import { useEffect, useState } from "react";
import { getProduct } from "../api/api";
import { Link, useParams } from "react-router-dom";
import {
    getCookingTypeLabel,
    getFlagsLabel,
    getProductCategoryLabel
} from "../utils/formatters";

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("ru-RU");
}

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

            {Array.isArray(product.photos) && product.photos.length > 0 && (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                    {product.photos.map((photo, index) => (
                        <img
                            key={photo}
                            src={photo}
                            alt={`Фото продукта ${index + 1}`}
                            style={{ width: "180px", height: "180px", objectFit: "cover" }}
                        />
                    ))}
                </div>
            )}

            <p><strong>Категория:</strong> {getProductCategoryLabel(product.category)}</p>
            <p><strong>Необходимость готовки:</strong> {getCookingTypeLabel(product.cookingType)}</p>
            <p><strong>Калорийность:</strong> {product.calories} ккал / 100 г</p>
            <p><strong>Белки:</strong> {product.proteins} г / 100 г</p>
            <p><strong>Жиры:</strong> {product.fats} г / 100 г</p>
            <p><strong>Углеводы:</strong> {product.carbs} г / 100 г</p>
            <p><strong>Состав:</strong> {product.composition || "—"}</p>
            <p><strong>Флаги:</strong> {getFlagsLabel(product.flags)}</p>
            <p><strong>Дата создания:</strong> {formatDate(product.createdAt)}</p>
            <p><strong>Дата изменения:</strong> {formatDate(product.updatedAt)}</p>

            <div style={{ marginTop: "16px" }}>
                <Link to={`/products/edit/${product.id}`}>Редактировать</Link>
                <Link to="/products" style={{ marginLeft: "12px" }}>Назад</Link>
            </div>
        </div>
    );
}