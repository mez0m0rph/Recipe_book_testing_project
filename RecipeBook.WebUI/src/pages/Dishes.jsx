import { useEffect, useState } from "react";
import { deleteDish, getDishes } from "../api/api";
import { Link } from "react-router-dom";

const categoryOptions = [
    { value: "", label: "Все" },
    { value: "Dessert", label: "Десерт" },
    { value: "FirstCourse", label: "Первое" },
    { value: "SecondCourse", label: "Второе" },
    { value: "Drink", label: "Напиток" },
    { value: "Salad", label: "Салат" },
    { value: "Soup", label: "Суп" },
    { value: "Snack", label: "Перекус" }
];

const flagOptions = [
    { bit: 1, label: "Веган" },
    { bit: 2, label: "Без глютена" },
    { bit: 4, label: "Без сахара" }
];

function flagsToNumber(flags) {
    return flags.reduce((acc, item) => acc + item, 0);
}

export default function Dishes() {
    const [dishes, setDishes] = useState([]);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState({
        search: "",
        category: "",
        flags: []
    });

    const fetchDishes = async () => {
        try {
            const params = {
                search: filters.search || undefined,
                category: filters.category || undefined
            };

            const flagValue = flagsToNumber(filters.flags);
            if (flagValue > 0) {
                params.flags = flagValue;
            }

            const data = await getDishes(params);
            setDishes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить блюда.");
        }
    };

    useEffect(() => {
        fetchDishes();
    }, [filters]);

    const toggleFlag = (bit) => {
        setFilters((prev) => ({
            ...prev,
            flags: prev.flags.includes(bit)
                ? prev.flags.filter((x) => x !== bit)
                : [...prev.flags, bit]
        }));
    };

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
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <h2 style={{ margin: 0 }}>Блюда</h2>
                <Link to="/dishes/create">Добавить блюдо</Link>
            </div>

            <div style={{ marginBottom: "16px", display: "grid", gap: "10px" }}>
                <input
                    placeholder="Поиск по названию"
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                />

                <select
                    value={filters.category}
                    onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                >
                    {categoryOptions.map((x) => (
                        <option key={x.value} value={x.value}>
                            {x.label}
                        </option>
                    ))}
                </select>

                <div>
                    {flagOptions.map((flag) => (
                        <label key={flag.bit} style={{ marginRight: "12px" }}>
                            <input
                                type="checkbox"
                                checked={filters.flags.includes(flag.bit)}
                                onChange={() => toggleFlag(flag.bit)}
                            />
                            {flag.label}
                        </label>
                    ))}
                </div>
            </div>

            {error && <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>}

            {dishes.length === 0 ? (
                <p>Пока нет блюд.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={th}>Название</th>
                            <th style={th}>Категория</th>
                            <th style={th}>Порция</th>
                            <th style={th}>Ккал</th>
                            <th style={th}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dishes.map((x) => (
                            <tr key={x.id}>
                                <td style={td}>{x.name}</td>
                                <td style={td}>{x.category}</td>
                                <td style={td}>{x.portionSize}</td>
                                <td style={td}>{x.calories}</td>
                                <td style={td}>
                                    <Link to={`/dishes/${x.id}`}>Открыть</Link>
                                    <Link to={`/dishes/edit/${x.id}`} style={{ marginLeft: "10px" }}>
                                        Редактировать
                                    </Link>
                                    <button type="button" onClick={() => handleDelete(x.id)} style={{ marginLeft: "10px" }}>
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

const th = {
    textAlign: "left",
    borderBottom: "1px solid #ccc",
    padding: "8px"
};

const td = {
    borderBottom: "1px solid #eee",
    padding: "8px"
};