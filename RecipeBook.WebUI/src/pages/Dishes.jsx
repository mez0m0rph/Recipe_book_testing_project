import { useEffect, useState } from "react";
import { deleteDish, getDishes } from "../api/api";
import { Link } from "react-router-dom";

export default function Dishes() {
    const [dishes, setDishes] = useState([]);
    const [error, setError] = useState("");

    const fetchDishes = async () => {
        try {
            const data = await getDishes();
            setDishes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить список блюд.");
        }
    };

    useEffect(() => {
        fetchDishes();
    }, []);

    const handleDelete = async (id) => {
        try {
            await deleteDish(id);
            await fetchDishes();
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || "Не удалось удалить блюдо.");
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
                <h2 style={{ margin: 0 }}>Блюда</h2>
                <Link to="/dishes/create">Добавить блюдо</Link>
            </div>

            {error && (
                <div style={{ color: "red", marginBottom: "12px" }}>
                    {error}
                </div>
            )}

            {dishes.length === 0 ? (
                <p>Пока нет блюд.</p>
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
                            <th style={cellHeaderStyle}>Порция, г</th>
                            <th style={cellHeaderStyle}>Ккал</th>
                            <th style={cellHeaderStyle}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dishes.map((dish) => (
                            <tr key={dish.id}>
                                <td style={cellStyle}>{dish.name}</td>
                                <td style={cellStyle}>{dish.category}</td>
                                <td style={cellStyle}>{dish.portionSize}</td>
                                <td style={cellStyle}>{dish.calories}</td>
                                <td style={cellStyle}>
                                    <Link to={`/dishes/edit/${dish.id}`}>
                                        Редактировать
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(dish.id)}
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