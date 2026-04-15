import { useEffect, useState } from "react";
import { getDish, getProducts } from "../api/api";
import { Link, useParams } from "react-router-dom";

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("ru-RU");
}

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
        return products.find((x) => x.id === productId)?.name || productId;
    };

    return (
        <div>
            <h2>{dish.name}</h2>

            <p><strong>Категория:</strong> {dish.category}</p>
            <p><strong>Размер порции:</strong> {dish.portionSize}</p>
            <p><strong>Калории:</strong> {dish.calories}</p>
            <p><strong>Белки:</strong> {dish.proteins}</p>
            <p><strong>Жиры:</strong> {dish.fats}</p>
            <p><strong>Углеводы:</strong> {dish.carbs}</p>
            <p><strong>Флаги:</strong> {String(dish.flags)}</p>
            <p><strong>Дата создания:</strong> {formatDate(dish.createdAt)}</p>
            <p><strong>Дата редактирования:</strong> {formatDate(dish.updatedAt)}</p>

            <h3>Состав</h3>
            <ul>
                {(dish.ingredients || []).map((x, index) => (
                    <li key={index}>
                        {resolveProductName(x.productId)} — {x.amount} г
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