import { useEffect, useMemo, useState } from "react";
import { createDish, getDish, getProducts, updateDish, uploadFiles } from "../api/api";
import { useNavigate, useParams } from "react-router-dom";
import {
    dishCategoryOptions,
    flagOptions,
    flagsToArray,
    flagsToNumber,
    getFlagsLabel,
    hasFlag,
    toNumber
} from "../utils/formatters";

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
    const [categoryWasChangedManually, setCategoryWasChangedManually] = useState(false);

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

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

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

                setCategoryWasChangedManually(true);
            })
            .catch((err) => {
                console.error(err);
                setError("Не удалось загрузить блюдо.");
            });
    }, [id]);

    const calculated = useMemo(() => {
        let calories = 0;
        let proteins = 0;
        let fats = 0;
        let carbs = 0;

        const filledIngredients = form.ingredients.filter(
            (ingredient) => ingredient.productId && toNumber(ingredient.amount) > 0
        );

        let veganAllowed = filledIngredients.length > 0;
        let glutenFreeAllowed = filledIngredients.length > 0;
        let sugarFreeAllowed = filledIngredients.length > 0;

        for (const ingredient of filledIngredients) {
            const product = products.find((x) => x.id === ingredient.productId);
            const amount = toNumber(ingredient.amount);

            if (!product) {
                continue;
            }

            calories += (toNumber(product.calories) * amount) / 100;
            proteins += (toNumber(product.proteins) * amount) / 100;
            fats += (toNumber(product.fats) * amount) / 100;
            carbs += (toNumber(product.carbs) * amount) / 100;

            if (!hasFlag(product.flags, "Vegan")) {
                veganAllowed = false;
            }

            if (!hasFlag(product.flags, "GlutenFree")) {
                glutenFreeAllowed = false;
            }

            if (!hasFlag(product.flags, "SugarFree")) {
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
            calories: String(calculated.calories),
            proteins: String(calculated.proteins),
            fats: String(calculated.fats),
            carbs: String(calculated.carbs),
            flags: prev.flags.filter((flag) => calculated.allowedFlags[flag])
        }));
    }, [
        calculated.calories,
        calculated.proteins,
        calculated.fats,
        calculated.carbs,
        calculated.allowedFlags.Vegan,
        calculated.allowedFlags.GlutenFree,
        calculated.allowedFlags.SugarFree
    ]);

    const handleBaseChange = (e) => {
        const { name, value } = e.target;

        if (name === "name") {
            const macroCategory = getMacroCategory(value);

            setForm((prev) => ({
                ...prev,
                name: value,
                category:
                    !categoryWasChangedManually && macroCategory
                        ? macroCategory
                        : prev.category
            }));

            return;
        }

        if (name === "category") {
            setCategoryWasChangedManually(true);
        }

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

    const handleFilesChange = (e) => {
        const files = Array.from(e.target.files || []);
        const availableSlots = Math.max(0, 5 - form.photos.length - selectedFiles.length);
        const filesToAdd = files.slice(0, availableSlots);

        setSelectedFiles((prev) => [...prev, ...filesToAdd]);

        e.target.value = "";
    };

    const removeSelectedFile = (index) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const removeUploadedPhoto = (index) => {
        setForm((prev) => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    const handleFlagChange = (flagValue, checked) => {
        if (!calculated.allowedFlags[flagValue]) {
            return;
        }

        setForm((prev) => ({
            ...prev,
            flags: checked
                ? [...prev.flags, flagValue]
                : prev.flags.filter((x) => x !== flagValue)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsSaving(true);

        try {
            let uploadedPhotoUrls = [];

            if (selectedFiles.length > 0) {
                uploadedPhotoUrls = await uploadFiles(selectedFiles);
            }

            const finalPhotos = [...form.photos, ...uploadedPhotoUrls].slice(0, 5);

            const cleanedIngredients = form.ingredients
                .map((ingredient) => ({
                    productId: ingredient.productId,
                    amount: toNumber(ingredient.amount)
                }))
                .filter((ingredient) => ingredient.productId && ingredient.amount > 0);

            const payload = {
                id: form.id || undefined,
                name: stripFirstMacro(form.name),
                photos: finalPhotos,
                calories: toNumber(form.calories),
                proteins: toNumber(form.proteins),
                fats: toNumber(form.fats),
                carbs: toNumber(form.carbs),
                portionSize: toNumber(form.portionSize),
                category: form.category,
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

            const bjuPer100g =
                payload.portionSize > 0
                    ? ((payload.proteins + payload.fats + payload.carbs) / payload.portionSize) * 100
                    : 0;

            if (bjuPer100g > 100) {
                setError("Сумма БЖУ на 100 грамм блюда не может превышать 100.");
                return;
            }

            if (id) {
                await updateDish(id, payload);
            } else {
                await createDish(payload);
            }

            navigate("/dishes");
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "Не удалось сохранить блюдо.");
        } finally {
            setIsSaving(false);
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
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleBaseChange}
                        placeholder="Например: !суп Борщ"
                        required
                    />
                </div>

                <div style={field}>
                    <label>Фотографии блюда, максимум 5</label>
                    <br />
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFilesChange}
                        disabled={form.photos.length + selectedFiles.length >= 5}
                    />
                    <div style={{ marginTop: "6px" }}>
                        Выбрано и загружено: {form.photos.length + selectedFiles.length} / 5
                    </div>
                </div>

                {selectedFiles.length > 0 && (
                    <div style={field}>
                        <strong>Выбранные файлы:</strong>
                        <ul>
                            {selectedFiles.map((file, index) => (
                                <li key={`${file.name}-${index}`}>
                                    {file.name}
                                    <button
                                        type="button"
                                        onClick={() => removeSelectedFile(index)}
                                        style={{ marginLeft: "8px" }}
                                    >
                                        Убрать
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {form.photos.length > 0 && (
                    <div style={field}>
                        <strong>Загруженные фото:</strong>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                            {form.photos.map((photo, index) => (
                                <div key={photo}>
                                    <img
                                        src={photo}
                                        alt={`Фото блюда ${index + 1}`}
                                        style={{ width: "120px", height: "120px", objectFit: "cover", display: "block" }}
                                    />
                                    <button type="button" onClick={() => removeUploadedPhoto(index)} style={{ marginTop: "6px" }}>
                                        Удалить
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={field}>
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

                <div style={field}>
                    <label>Категория</label>
                    <br />
                    <select name="category" value={form.category} onChange={handleBaseChange}>
                        {dishCategoryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div style={{ marginTop: "6px", color: "#666" }}>
                        Если категория выбрана вручную, она имеет приоритет над макросом в названии.
                    </div>
                </div>

                <div style={field}>
                    <label>Состав блюда</label>

                    {form.ingredients.map((ingredient, index) => (
                        <div
                            key={index}
                            style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }}
                        >
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
                    <label>Доступные флаги блюда</label>

                    {flagOptions.map((flag) => (
                        <div key={flag.value}>
                            <label style={{ opacity: calculated.allowedFlags[flag.value] ? 1 : 0.5 }}>
                                <input
                                    type="checkbox"
                                    checked={form.flags.includes(flag.value)}
                                    disabled={!calculated.allowedFlags[flag.value]}
                                    onChange={(e) => handleFlagChange(flag.value, e.target.checked)}
                                />
                                {flag.label}
                                {!calculated.allowedFlags[flag.value] && " — недоступно по составу"}
                            </label>
                        </div>
                    ))}

                    <div style={{ marginTop: "6px" }}>
                        Текущие флаги: {getFlagsLabel(flagsToNumber(form.flags))}
                    </div>
                </div>

                <div style={field}>
                    <strong>КБЖУ рассчитывается автоматически при изменении состава</strong>
                </div>

                <div style={field}>
                    <label>Калорийность, ккал / порция</label>
                    <br />
                    <input type="number" step="0.01" min="0" name="calories" value={form.calories} onChange={handleBaseChange} required />
                </div>

                <div style={field}>
                    <label>Белки, г / порция</label>
                    <br />
                    <input type="number" step="0.01" min="0" name="proteins" value={form.proteins} onChange={handleBaseChange} required />
                </div>

                <div style={field}>
                    <label>Жиры, г / порция</label>
                    <br />
                    <input type="number" step="0.01" min="0" name="fats" value={form.fats} onChange={handleBaseChange} required />
                </div>

                <div style={field}>
                    <label>Углеводы, г / порция</label>
                    <br />
                    <input type="number" step="0.01" min="0" name="carbs" value={form.carbs} onChange={handleBaseChange} required />
                </div>

                <button type="submit" disabled={isSaving}>
                    {isSaving ? "Сохранение..." : "Сохранить"}
                </button>
            </form>
        </div>
    );
}

const field = {
    marginBottom: "16px"
};