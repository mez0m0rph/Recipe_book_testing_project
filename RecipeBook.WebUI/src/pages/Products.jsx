import { useEffect, useState } from "react";
import { deleteProduct, getProducts } from "../api/api";
import { Link } from "react-router-dom";
import {
    cookingTypeOptions,
    flagOptions,
    getCookingTypeLabel,
    getFlagsLabel,
    getProductCategoryLabel,
    productCategoryOptions
} from "../utils/formatters";

const sortOptions = [
    { value: "name", label: "Название" },
    { value: "calories", label: "Калорийность" },
    { value: "proteins", label: "Белки" },
    { value: "fats", label: "Жиры" },
    { value: "carbs", label: "Углеводы" }
];

function flagsToFilterNumber(flags) {
    return flags.reduce((sum, bit) => sum + bit, 0);
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

            const flags = flagsToFilterNumber(filters.flags);
            if (flags > 0) {
                params.flags = flags;
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
            await deleteProduct(id);
            await fetchProducts();
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || "Не удалось удалить продукт.");
        }
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
                    <option value="">Все категории</option>
                    {productCategoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.cookingType}
                    onChange={(e) => setFilters((prev) => ({ ...prev, cookingType: e.target.value }))}
                >
                    <option value="">Любая готовность</option>
                    {cookingTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                >
                    {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            Сортировка: {option.label}
                        </option>
                    ))}
                </select>

                <div>
                    {flagOptions.map((flag) => (
                        <label key={flag.value} style={{ marginRight: "12px" }}>
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
                            <th style={th}>Готовность</th>
                            <th style={th}>Флаги</th>
                            <th style={th}>Ккал</th>
                            <th style={th}>Б</th>
                            <th style={th}>Ж</th>
                            <th style={th}>У</th>
                            <th style={th}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td style={td}>{product.name}</td>
                                <td style={td}>{getProductCategoryLabel(product.category)}</td>
                                <td style={td}>{getCookingTypeLabel(product.cookingType)}</td>
                                <td style={td}>{getFlagsLabel(product.flags)}</td>
                                <td style={td}>{product.calories}</td>
                                <td style={td}>{product.proteins}</td>
                                <td style={td}>{product.fats}</td>
                                <td style={td}>{product.carbs}</td>
                                <td style={td}>
                                    <Link to={`/products/${product.id}`}>Открыть</Link>
                                    <Link to={`/products/edit/${product.id}`} style={{ marginLeft: "10px" }}>
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

const th = {
    textAlign: "left",
    borderBottom: "1px solid #ccc",
    padding: "8px"
};

const td = {
    borderBottom: "1px solid #eee",
    padding: "8px"
};