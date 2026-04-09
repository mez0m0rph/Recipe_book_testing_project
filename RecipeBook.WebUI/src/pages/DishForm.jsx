import { useEffect, useMemo, useState } from "react";
import { createDish, getDish, getProducts, updateDish } from "../api/api";
import { useNavigate, useParams } from "react-router-dom";

const categoryOptions = [
    { value: "Dessert", label: "Десерт" },
    { value: "FirstCourse", label: "Первое" },
    { value: "SecondCourse", label: "Второе" },
    { value: "Drink", label: "Напиток" },
    { value: "Salad", label: "Салат" },
    { value: "Soup", label: "Суп" },
    { value: "Snack", label: "Перекус" }
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

export default function DishForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({
        id: "",
        name: "",
        photos: [],
        calories: 0,
        proteins: 0,
        fats: 0,
        carbs: 0,
        portionSize: "",
        category: "Snack",
        flags: [],
        ingredients: [
            {
                productId: "",
                amount: ""
            }
        ]
    });

    const [error, setError] = useState("");

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await getProducts();
                setProducts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setError("Не удалось загрузить продукты.");
            }
        };

        loadProducts();
    }, []);

    useEffect(() => {
        if (!id) {
            return;
        }

        const loadDish = async () => {
            try {
                const data = await getDish(id);

                setForm({
                    id: data.id ?? "",
                    name: data.name ?? "",
                    photos: Array.isArray(data.photos) ? data.photos : [],
                    calories: data.calories ?? 0,
                    proteins: data.proteins ?? 0,
                    fats: data.fats ?? 0,
                    carbs: data.carbs ?? 0,
                    portionSize: data.portionSize ?? "",
                    category: data.category ?? "Snack",
                    flags: flagsToArray(data.flags),
                    ingredients:
                        Array.isArray(data.ingredients) && data.ingredients.length > 0
                            ? data.ingredients.map((item) => ({
                                  productId: item.productId ?? "",
                                  amount: item.amount ?? ""
                              }))
                            : [
                                  {
                                      productId: "",
                                      amount: ""
                                  }
                              ]
                });
            } catch (err) {
                console.error(err);
                setError("Не удалось загрузить блюдо.");
            }
        };

        loadDish();
    }, [id]);

    const calculatedNutrition = useMemo(() => {
        let calories = 0;
        let proteins = 0;
        let fats = 0;
        let carbs = 0;

        form.ingredients.forEach((ingredient) => {
            const product = products.find((p) => p.id === ingredient.productId);
            const amount = toNumber(ingredient.amount);

            if (!product || amount <= 0) {
                return;
            }

            calories += (toNumber(product.calories) * amount) / 100;
            proteins += (toNumber(product.proteins) * amount) / 100;
            fats += (toNumber(product.fats) * amount) / 100;
            carbs += (toNumber(product.carbs) * amount) / 100;
        });

        return {
            calories: Number(calories.toFixed(2)),
            proteins: Number(proteins.toFixed(2)),
            fats: Number(fats.toFixed(2)),
            carbs: Number(carbs.toFixed(2))
        };
    }, [form.ingredients, products]);

    const handleBaseChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleIngredientChange = (index, field, value) => {
        setForm((prev) => ({
            ...prev,
            ingredients: prev.ingredients.map((item, i) =>
                i === index
                    ? {
                          ...item,
                          [field]: value
                      }
                    : item
            )
        }));
    };

    const addIngredient = () => {
        setForm((prev) => ({
            ...prev,
            ingredients: [
                ...prev.ingredients,
                {
                    productId: "",
                    amount: ""
                }
            ]
        }));
    };

    const removeIngredient = (index) => {
        setForm((prev) => ({
            ...prev,
            ingredients:
                prev.ingredients.length === 1
                    ? prev.ingredients
                    : prev.ingredients.filter((_, i) => i !== index)
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

        const cleanedIngredients = form.ingredients
            .map((item) => ({
                productId: item.productId,
                amount: toNumber(item.amount)
            }))
            .filter((item) => item.productId && item.amount > 0);

        const payload = {
            id: form.id || undefined,
            name: form.name.trim(),
            photos: Array.isArray(form.photos) ? form.photos : [],
            calories: calculatedNutrition.calories,
            proteins: calculatedNutrition.proteins,
            fats: calculatedNutrition.fats,
            carbs: calculatedNutrition.carbs,
            portionSize: toNumber(form.portionSize),
            category: form.category,
            flags: flagsToNumber(form.flags),
            ingredients: cleanedIngredients
        };

        if (payload.name.length < 2) {
            setError("Название блюда должно содержать минимум 2 символа.");
            return;
        }

        if (payload.portionSize <= 0) {
            setError("Размер порции должен быть больше 0.");
            return;
        }

        if (payload.ingredients.length === 0) {
            setError("Добавь хотя бы один продукт в состав блюда.");
            return;
        }

        try {
            if (id) {
                await updateDish(id, payload);
            } else {
                await createDish(payload);
            }

            navigate("/dishes");
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "Не удалось сохранить блюдо.");
        }
    };

    return (
        <div>
            <h2>{id ? "Редактировать блюдо" : "Создать блюдо"}</h2>

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
                        onChange={handleBaseChange}
                        required
                    />
                </div>

                <div style={fieldStyle}>
                    <label>Размер порции, г</label>
                    <br />
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        name="portionSize"
                        value={form.portionSize}
                        onChange={handleBaseChange}
                        required
                    />
                </div>

                <div style={fieldStyle}>
                    <label>Категория</label>
                    <br />
                    <select
                        name="category"
                        value={form.category}
                        onChange={handleBaseChange}
                    >
                        {categoryOptions.map((option) => (
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

                <div style={fieldStyle}>
                    <label>Состав блюда</label>

                    {form.ingredients.map((ingredient, index) => (
                        <div
                            key={index}
                            style={{
                                display: "flex",
                                gap: "8px",
                                alignItems: "center",
                                marginTop: "8px"
                            }}
                        >
                            <select
                                value={ingredient.productId}
                                onChange={(e) =>
                                    handleIngredientChange(index, "productId", e.target.value)
                                }
                            >
                                <option value="">Выбери продукт</option>
                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Количество, г"
                                value={ingredient.amount}
                                onChange={(e) =>
                                    handleIngredientChange(index, "amount", e.target.value)
                                }
                            />

                            <button
                                type="button"
                                onClick={() => removeIngredient(index)}
                            >
                                Удалить
                            </button>
                        </div>
                    ))}

                    <div style={{ marginTop: "10px" }}>
                        <button type="button" onClick={addIngredient}>
                            Добавить ингредиент
                        </button>
                    </div>
                </div>

                <div style={fieldStyle}>
                    <strong>Автоматический расчёт КБЖУ:</strong>
                    <div>Калории: {calculatedNutrition.calories}</div>
                    <div>Белки: {calculatedNutrition.proteins}</div>
                    <div>Жиры: {calculatedNutrition.fats}</div>
                    <div>Углеводы: {calculatedNutrition.carbs}</div>
                </div>

                <button type="submit">Сохранить</button>
            </form>
        </div>
    );
}

const fieldStyle = {
    marginBottom: "16px"
};