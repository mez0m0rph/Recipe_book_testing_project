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
        return flagOptions.filter((f) => (flags & f.bit) === f.bit).map((f) => f.value);
    }

    if (typeof flags === "string") {
        if (!flags || flags === "None") {
            return [];
        }

        return flags.split(",").map((x) => x.trim()).filter(Boolean);
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

function getMacroCategory(name) {
    const words = (name || "").split(" ").filter(Boolean);
    const macro = words.find((x) => x.startsWith("!"));

    switch ((macro || "").toLowerCase()) {
        case "!десерт":
            return "Dessert";
        case "!первое":
            return "FirstCourse";
        case "!второе":
            return "SecondCourse";
        case "!напиток":
            return "Drink";
        case "!салат":
            return "Salad";
        case "!суп":
            return "Soup";
        case "!перекус":
            return "Snack";
        default:
            return null;
    }
}

function stripFirstMacro(name) {
    const words = (name || "").split(" ").filter(Boolean);
    const index = words.findIndex((x) => x.startsWith("!"));

    if (index >= 0) {
        words.splice(index, 1);
    }

    return words.join(" ").trim();
}

export default function DishForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({
        id: "",
        name: "",
        photos: [],
        portionSize: "",
        category: "Snack",
        flags: [],
        ingredients: [{ productId: "", amount: "" }],
        calories: "",
        proteins: "",
        fats: "",
        carbs: ""
    });

    const [error, setError] = useState("");

    useEffect(() => {
        getProducts()
            .then((data) => {
                setProducts(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error(err);
                setError("Не удалось загрузить продукты.");
            });
    }, []);

    useEffect(() => {
        if (!id) {
            return;
        }

        getDish(id)
            .then((data) => {
                setForm({
                    id: data.id ?? "",
                    name: data.name ?? "",
                    photos: Array.isArray(data.photos) ? data.photos : [],
                    portionSize: data.portionSize ?? "",
                    category: data.category ?? "Snack",
                    flags: flagsToArray(data.flags),
                    ingredients:
                        Array.isArray(data.ingredients) && data.ingredients.length > 0
                            ? data.ingredients.map((x) => ({
                                  productId: x.productId ?? "",
                                  amount: x.amount ?? ""
                              }))
                            : [{ productId: "", amount: "" }],
                    calories: data.calories ?? "",
                    proteins: data.proteins ?? "",
                    fats: data.fats ?? "",
                    carbs: data.carbs ?? ""
                });
            })
            .catch((err) => {
                console.error(err);
                setError("Не удалось загрузить блюдо.");
            });
    }, [id]);

    const draftNutrition = useMemo(() => {
        let calories = 0;
        let proteins = 0;
        let fats = 0;
        let carbs = 0;

        let veganAllowed = true;
        let glutenFreeAllowed = true;
        let sugarFreeAllowed = true;

        for (const ingredient of form.ingredients) {
            const product = products.find((p) => p.id === ingredient.productId);
            const amount = toNumber(ingredient.amount);

            if (!product || amount <= 0) {
                continue;
            }

            calories += (toNumber(product.calories) * amount) / 100;
            proteins += (toNumber(product.proteins) * amount) / 100;
            fats += (toNumber(product.fats) * amount) / 100;
            carbs += (toNumber(product.carbs) * amount) / 100;

            const productFlagsNumber = typeof product.flags === "number" ? product.flags : 0;

            if ((productFlagsNumber & 1) !== 1) {
                veganAllowed = false;
            }

            if ((productFlagsNumber & 2) !== 2) {
                glutenFreeAllowed = false;
            }

            if ((productFlagsNumber & 4) !== 4) {
                sugarFreeAllowed = false;
            }
        }

        return {
            calories: Number(calories.toFixed(2)),
            proteins: Number(proteins.toFixed(2)),
            fats: Number(fats.toFixed(2)),
            carbs: Number(carbs.toFixed(2)),
            allowedFlags: {
                Vegan: veganAllowed,
                GlutenFree: glutenFreeAllowed,
                SugarFree: sugarFreeAllowed
            }
        };
    }, [form.ingredients, products]);

    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            flags: prev.flags.filter((flag) => draftNutrition.allowedFlags[flag]),
            calories: prev.calories === "" ? draftNutrition.calories : prev.calories,
            proteins: prev.proteins === "" ? draftNutrition.proteins : prev.proteins,
            fats: prev.fats === "" ? draftNutrition.fats : prev.fats,
            carbs: prev.carbs === "" ? draftNutrition.carbs : prev.carbs
        }));
    }, [draftNutrition.calories, draftNutrition.proteins, draftNutrition.fats, draftNutrition.carbs, draftNutrition.allowedFlags.Vegan, draftNutrition.allowedFlags.GlutenFree, draftNutrition.allowedFlags.SugarFree]);

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
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const addIngredient = () => {
        setForm((prev) => ({
            ...prev,
            ingredients: [...prev.ingredients, { productId: "", amount: "" }]
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

    const handlePhotosChange = (e) => {
        const items = e.target.value
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, 5);

        setForm((prev) => ({
            ...prev,
            photos: items
        }));
    };

    const handleFlagChange = (flagValue, checked) => {
        if (!draftNutrition.allowedFlags[flagValue]) {
            return;
        }

        setForm((prev) => ({
            ...prev,
            flags: checked
                ? [...prev.flags, flagValue]
                : prev.flags.filter((x) => x !== flagValue)
        }));
    };

    const resetDraftValues = () => {
        setForm((prev) => ({
            ...prev,
            calories: draftNutrition.calories,
            proteins: draftNutrition.proteins,
            fats: draftNutrition.fats,
            carbs: draftNutrition.carbs
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const cleanedIngredients = form.ingredients
            .map((x) => ({
                productId: x.productId,
                amount: toNumber(x.amount)
            }))
            .filter((x) => x.productId && x.amount > 0);

        const macroCategory = getMacroCategory(form.name);

        const payload = {
            id: form.id || undefined,
            name: stripFirstMacro(form.name),
            photos: form.photos,
            calories: toNumber(form.calories),
            proteins: toNumber(form.proteins),
            fats: toNumber(form.fats),
            carbs: toNumber(form.carbs),
            portionSize: toNumber(form.portionSize),
            category: form.category || macroCategory || "Snack",
            flags: flagsToNumber(form.flags),
            ingredients: cleanedIngredients
        };

        if (payload.name.length < 2) {
            setError("Название блюда должно содержать минимум 2 символа.");
            return;
        }

        if (payload.photos.length > 5) {
            setError("Можно указать не более 5 фотографий.");
            return;
        }

        if (payload.portionSize <= 0) {
            setError("Размер порции должен быть больше 0.");
            return;
        }

        if (payload.ingredients.length < 1) {
            setError("Нужно добавить хотя бы один продукт в состав.");
            return;
        }

        if (payload.proteins + payload.fats + payload.carbs > 100) {
            setError("Сумма БЖУ не может превышать 100.");
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

            {error && <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div style={field}>
                    <label>Название</label>
                    <br />
                    <input name="name" value={form.name} onChange={handleBaseChange} required />
                </div>

                <div style={field}>
                    <label>Фотографии (по одной ссылке на строку, максимум 5)</label>
                    <br />
                    <textarea rows="5" value={form.photos.join("\n")} onChange={handlePhotosChange} />
                </div>

                <div style={field}>
                    <label>Размер порции, г</label>
                    <br />
                    <input type="number" min="0.01" step="0.01" name="portionSize" value={form.portionSize} onChange={handleBaseChange} required />
                </div>

                <div style={field}>
                    <label>Категория</label>
                    <br />
                    <select name="category" value={form.category} onChange={handleBaseChange}>
                        {categoryOptions.map((x) => (
                            <option key={x.value} value={x.value}>
                                {x.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={field}>
                    <label>Флаги</label>
                    {flagOptions.map((flag) => (
                        <div key={flag.value}>
                            <label style={{ opacity: draftNutrition.allowedFlags[flag.value] ? 1 : 0.5 }}>
                                <input
                                    type="checkbox"
                                    checked={form.flags.includes(flag.value)}
                                    disabled={!draftNutrition.allowedFlags[flag.value]}
                                    onChange={(e) => handleFlagChange(flag.value, e.target.checked)}
                                />
                                {flag.label}
                            </label>
                        </div>
                    ))}
                </div>

                <div style={field}>
                    <label>Состав блюда</label>

                    {form.ingredients.map((ingredient, index) => (
                        <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }}>
                            <select
                                value={ingredient.productId}
                                onChange={(e) => handleIngredientChange(index, "productId", e.target.value)}
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
                                onChange={(e) => handleIngredientChange(index, "amount", e.target.value)}
                            />

                            <button type="button" onClick={() => removeIngredient(index)}>
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

                <div style={field}>
                    <strong>Черновые автоматически рассчитанные КБЖУ</strong>
                    <div>Калории: {draftNutrition.calories}</div>
                    <div>Белки: {draftNutrition.proteins}</div>
                    <div>Жиры: {draftNutrition.fats}</div>
                    <div>Углеводы: {draftNutrition.carbs}</div>
                    <button type="button" onClick={resetDraftValues} style={{ marginTop: "8px" }}>
                        Подставить черновые значения
                    </button>
                </div>

                <div style={field}>
                    <label>Калории (можно скорректировать вручную)</label>
                    <br />
                    <input type="number" step="0.01" min="0" name="calories" value={form.calories} onChange={handleBaseChange} required />
                </div>

                <div style={field}>
                    <label>Белки (можно скорректировать вручную)</label>
                    <br />
                    <input type="number" step="0.01" min="0" name="proteins" value={form.proteins} onChange={handleBaseChange} required />
                </div>

                <div style={field}>
                    <label>Жиры (можно скорректировать вручную)</label>
                    <br />
                    <input type="number" step="0.01" min="0" name="fats" value={form.fats} onChange={handleBaseChange} required />
                </div>

                <div style={field}>
                    <label>Углеводы (можно скорректировать вручную)</label>
                    <br />
                    <input type="number" step="0.01" min="0" name="carbs" value={form.carbs} onChange={handleBaseChange} required />
                </div>

                <button type="submit">Сохранить</button>
            </form>
        </div>
    );
}

const field = {
    marginBottom: "16px"
};