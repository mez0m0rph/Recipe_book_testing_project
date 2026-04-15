import { useEffect, useState } from "react";
import { deleteProduct, getProducts } from "../api/api";
import { Link } from "react-router-dom";

const categoryOptions = [
    { value: "", label: "Все" },
    { value: "Frozen", label: "Замороженный" },
    { value: "Meat", label: "Мясной" },
    { value: "Vegetables", label: "Овощи" },
    { value: "Greens", label: "Зелень" },
    { value: "Spices", label: "Специи" },
    { value: "Grains", label: "Крупы" },
    { value: "Canned", label: "Консервы" },
    { value: "Liquid", label: "Жидкость" },
    { value: "Sweets", label: "Сладости" }
];

const cookingTypeOptions = [
    { value: "", label: "Все" },
    { value: "ReadyToEat", label: "Готовый к употреблению" },
    { value: "SemiFinished", label: "Полуфабрикат" },
    { value: "RequiresCooking", label: "Требует приготовления" }
];

const sortOptions = [
    { value: "name", label: "Название" },
    { value: "calories", label: "Калорийность" },
    { value: "proteins", label: "Белки" },
    { value: "fats", label: "Жиры" },
    { value: "carbs", label: "Углеводы" }
];

const flagOptions = [
    { bit: 1, label: "Веган" },
    { bit: 2, label: "Без глютена" },
    { bit: 4, label: "Без сахара" }
];

function flagsToNumber(flags) {
    return flags.reduce((acc, item) => acc + item, 0);
}

export default function Products() {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState({
        search: "",
        category: "",
        cookingType: "",
        sortBy: "name",
        flags: []
    });

    const fetchProducts = async () => {
        try {
            const params = {
                search: filters.search || undefined,
                category: filters.category || undefined,
                cookingType: filters.cookingType || undefined,
                sortBy: filters.sortBy || undefined
            };

            const flagValue = flagsToNumber(filters.flags);
            if (flagValue > 0) {
                params.flags = flagValue;
            }

            const data = await getProducts(params);
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить продукты.");
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [filters]);

    const handleDelete = async (id) => {
        try {
            await deleteProduct(id);
            await fetchProducts();
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || "Не удалось удалить продукт.");
        }
    };

    const toggleFlag = (bit) => {
        setFilters((prev) => ({
            ...prev,
            flags: prev.flags.includes(bit)
                ? prev.flags.filter((x) => x !== bit)
                : [...prev.flags, bit]
        }));
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <h2 style={{ margin: 0 }}>Продукты</h2>
                <Link to="/products/create">Добавить продукт</Link>
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

                <select
                    value={filters.cookingType}
                    onChange={(e) => setFilters((prev) => ({ ...prev, cookingType: e.target.value }))}
                >
                    {cookingTypeOptions.map((x) => (
                        <option key={x.value} value={x.value}>
                            {x.label}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                >
                    {sortOptions.map((x) => (
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

            {products.length === 0 ? (
                <p>Пока нет продуктов.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={th}>Название</th>
                            <th style={th}>Категория</th>
                            <th style={th}>Готовка</th>
                            <th style={th}>Ккал</th>
                            <th style={th}>Б</th>
                            <th style={th}>Ж</th>
                            <th style={th}>У</th>
                            <th style={th}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((x) => (
                            <tr key={x.id}>
                                <td style={td}>{x.name}</td>
                                <td style={td}>{x.category}</td>
                                <td style={td}>{x.cookingType}</td>
                                <td style={td}>{x.calories}</td>
                                <td style={td}>{x.proteins}</td>
                                <td style={td}>{x.fats}</td>
                                <td style={td}>{x.carbs}</td>
                                <td style={td}>
                                    <Link to={`/products/${x.id}`}>Открыть</Link>
                                    <Link to={`/products/edit/${x.id}`} style={{ marginLeft: "10px" }}>
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