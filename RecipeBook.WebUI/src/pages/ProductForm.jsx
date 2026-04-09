import { useEffect, useState } from "react";
import { createProduct, getProduct, updateProduct } from "../api/api";
import { useNavigate, useParams } from "react-router-dom";

const categoryOptions = [
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
    { value: "ReadyToEat", label: "Готовый к употреблению" },
    { value: "SemiFinished", label: "Полуфабрикат" },
    { value: "RequiresCooking", label: "Требует приготовления" }
];

const flagOptions = [
    { value: "Vegan", label: "Веган", bit: 1 },
    { value: "GlutenFree", label: "Без глютена", bit: 2 },
    { value: "SugarFree", label: "Без сахара", bit: 4 }
];

function flagsToArray(flags) {
    if (typeof flags === "number") {
        return flagOptions
            .filter((f) => (flags & f.bit) === f.bit)
            .map((f) => f.value);
    }

    if (typeof flags === "string") {
        if (!flags || flags === "None") {
            return [];
        }

        return flags
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
    }

    return [];
}

function flagsToNumber(flagsArray) {
    return flagOptions.reduce((acc, flag) => {
        if (flagsArray.includes(flag.value)) {
            return acc + flag.bit;
        }

        return acc;
    }, 0);
}

function toNumber(value) {
    if (value === "" || value === null || value === undefined) {
        return 0;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

export default function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        id: "",
        name: "",
        photos: [],
        calories: "",
        proteins: "",
        fats: "",
        carbs: "",
        composition: "",
        category: "Vegetables",
        cookingType: "ReadyToEat",
        flags: []
    });

    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) {
            return;
        }

        const load = async () => {
            try {
                const data = await getProduct(id);

                setForm({
                    id: data.id ?? "",
                    name: data.name ?? "",
                    photos: Array.isArray(data.photos) ? data.photos : [],
                    calories: data.calories ?? "",
                    proteins: data.proteins ?? "",
                    fats: data.fats ?? "",
                    carbs: data.carbs ?? "",
                    composition: data.composition ?? "",
                    category: data.category ?? "Vegetables",
                    cookingType: data.cookingType ?? "ReadyToEat",
                    flags: flagsToArray(data.flags)
                });
            } catch (err) {
                console.error(err);
                setError("Не удалось загрузить продукт.");
            }
        };

        load();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "number" ? value : value
        }));
    };

    const handleFlagChange = (flagValue, checked) => {
        setForm((prev) => ({
            ...prev,
            flags: checked
                ? [...prev.flags, flagValue]
                : prev.flags.filter((f) => f !== flagValue)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const payload = {
            id: form.id || undefined,
            name: form.name.trim(),
            photos: Array.isArray(form.photos) ? form.photos : [],
            calories: toNumber(form.calories),
            proteins: toNumber(form.proteins),
            fats: toNumber(form.fats),
            carbs: toNumber(form.carbs),
            composition: form.composition?.trim() || null,
            category: form.category,
            cookingType: form.cookingType,
            flags: flagsToNumber(form.flags)
        };

        if (payload.name.length < 2) {
            setError("Название продукта должно содержать минимум 2 символа.");
            return;
        }

        if (payload.proteins + payload.fats + payload.carbs > 100) {
            setError("Сумма БЖУ не может превышать 100.");
            return;
        }

        try {
            if (id) {
                await updateProduct(id, payload);
            } else {
                await createProduct(payload);
            }

            navigate("/products");
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "Не удалось сохранить продукт.");
        }
    };

    return (
        <div>
            <h2>{id ? "Редактировать продукт" : "Создать продукт"}</h2>

            {error && (
                <div style={{ color: "red", marginBottom: "12px" }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={fieldStyle}>
                    <label>Название</label>
                    <br />
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={fieldStyle}>
                    <label>Калорийность</label>
                    <br />
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="calories"
                        value={form.calories}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={fieldStyle}>
                    <label>Белки</label>
                    <br />
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        name="proteins"
                        value={form.proteins}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={fieldStyle}>
                    <label>Жиры</label>
                    <br />
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        name="fats"
                        value={form.fats}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={fieldStyle}>
                    <label>Углеводы</label>
                    <br />
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        name="carbs"
                        value={form.carbs}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={fieldStyle}>
                    <label>Состав</label>
                    <br />
                    <textarea
                        name="composition"
                        value={form.composition}
                        onChange={handleChange}
                        rows="4"
                        cols="40"
                    />
                </div>

                <div style={fieldStyle}>
                    <label>Категория</label>
                    <br />
                    <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                    >
                        {categoryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={fieldStyle}>
                    <label>Необходимость готовки</label>
                    <br />
                    <select
                        name="cookingType"
                        value={form.cookingType}
                        onChange={handleChange}
                    >
                        {cookingTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={fieldStyle}>
                    <label>Флаги</label>
                    {flagOptions.map((flag) => (
                        <div key={flag.value}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={form.flags.includes(flag.value)}
                                    onChange={(e) =>
                                        handleFlagChange(flag.value, e.target.checked)
                                    }
                                />
                                {flag.label}
                            </label>
                        </div>
                    ))}
                </div>

                <button type="submit">Сохранить</button>
            </form>
        </div>
    );
}

const fieldStyle = {
    marginBottom: "12px"
};