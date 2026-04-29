import { useEffect, useState } from "react";
import { getDish, getProducts } from "../api/api";
import { Link, useParams } from "react-router-dom";
import {
    getDishCategoryLabel,
    getFlagsLabel
} from "../utils/formatters";

export default function DishView() {
    const { id } = useParams();
    const [dish, setDish] = useState(null);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([getDish(id), getProducts()])
            .then(([dishData, productsData]) => {
                setDish(dishData);
                setProducts(Array.isArray(productsData) ? productsData : []);
            })
            .catch((err) => {
                console.error(err);
                setError("Не удалось загрузить блюдо.");
            });
    }, [id]);

    if (error) {
        return <div style={{ color: "red" }}>{error}</div>;
    }

    if (!dish) {
        return <div>Загрузка...</div>;
    }

    const resolveProductName = (productId) => {
        return products.find((product) => product.id === productId)?.name || productId;
    };

    return (
        <div>
            <h2>{dish.name}</h2>

            {Array.isArray(dish.photos) && dish.photos.length > 0 && (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                    {dish.photos.map((photo, index) => (
                        <img
                            key={photo}
                            src={photo}
                            alt={`Фото блюда ${index + 1}`}
                            style={{ width: "180px", height: "180px", objectFit: "cover" }}
                        />
                    ))}
                </div>
            )}

            <p><strong>Категория:</strong> {getDishCategoryLabel(dish.category)}</p>
            <p><strong>Размер порции:</strong> {dish.portionSize} г</p>
            <p><strong>Калорийность:</strong> {dish.calories} ккал / порция</p>
            <p><strong>Белки:</strong> {dish.proteins} г / порция</p>
            <p><strong>Жиры:</strong> {dish.fats} г / порция</p>
            <p><strong>Углеводы:</strong> {dish.carbs} г / порция</p>
            <p><strong>Флаги:</strong> {getFlagsLabel(dish.flags)}</p>

            <h3>Состав</h3>
            <ul>
                {(dish.ingredients || []).map((ingredient, index) => (
                    <li key={index}>
                        {resolveProductName(ingredient.productId)} — {ingredient.amount} г
                    </li>
                ))}
            </ul>

            <div style={{ marginTop: "16px" }}>
                <Link to={`/dishes/edit/${dish.id}`}>Редактировать</Link>
                <Link to="/dishes" style={{ marginLeft: "12px" }}>Назад</Link>
            </div>
        </div>
    );
}