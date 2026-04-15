import { useEffect, useState } from "react";
import { createProduct, getProduct, updateProduct, uploadFiles } from "../api/api";
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

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!id) {
            return;
        }

        getProduct(id)
            .then((data) => {
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
            })
            .catch((err) => {
                console.error(err);
                setError("Не удалось загрузить продукт.");
            });
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFlagChange = (flagValue, checked) => {
        setForm((prev) => ({
            ...prev,
            flags: checked
                ? [...prev.flags, flagValue]
                : prev.flags.filter((x) => x !== flagValue)
        }));
    };

    const handleFilesChange = (e) => {
        const files = Array.from(e.target.files || []).slice(0, 5);
        setSelectedFiles(files);
    };

    const removePhoto = (index) => {
        setForm((prev) => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
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

            const payload = {
                id: form.id || undefined,
                name: form.name.trim(),
                photos: finalPhotos,
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
                setIsSaving(false);
                return;
            }

            if (payload.photos.length > 5) {
                setError("Можно указать не более 5 фотографий.");
                setIsSaving(false);
                return;
            }

            if (payload.proteins + payload.fats + payload.carbs > 100) {
                setError("Сумма БЖУ не может превышать 100.");
                setIsSaving(false);
                return;
            }

            if (id) {
                await updateProduct(id, payload);
            } else {
                await createProduct(payload);
            }

            navigate("/products");
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "Не удалось сохранить продукт.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <h2>{id ? "Редактировать продукт" : "Создать продукт"}</h2>

            {error && <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div style={field}>
                    <label>Название</label>
                    <br />
                    <input name="name" value={form.name} onChange={handleChange} required />
                </div>

                <div style={field}>
                    <label>Фотографии (до 5 файлов)</label>
                    <br />
                    <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
                </div>

                {form.photos.length > 0 && (
                    <div style={field}>
                        <strong>Уже загруженные фото:</strong>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                            {form.photos.map((photo, index) => (
                                <div key={index}>
                                    <img
                                        src={photo}
                                        alt={`Фото ${index + 1}`}
                                        style={{ width: "120px", height: "120px", objectFit: "cover", display: "block" }}
                                    />
                                    <button type="button" onClick={() => removePhoto(index)} style={{ marginTop: "6px" }}>
                                        Удалить
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={field}>
                    <label>Калорийность</label>
                    <br />
                    <input type="number" step="0.01" min="0" name="calories" value={form.calories} onChange={handleChange} required />
                </div>

                <div style={field}>
                    <label>Белки</label>
                    <br />
                    <input type="number" step="0.01" min="0" max="100" name="proteins" value={form.proteins} onChange={handleChange} required />
                </div>

                <div style={field}>
                    <label>Жиры</label>
                    <br />
                    <input type="number" step="0.01" min="0" max="100" name="fats" value={form.fats} onChange={handleChange} required />
                </div>

                <div style={field}>
                    <label>Углеводы</label>
                    <br />
                    <input type="number" step="0.01" min="0" max="100" name="carbs" value={form.carbs} onChange={handleChange} required />
                </div>

                <div style={field}>
                    <label>Состав</label>
                    <br />
                    <textarea name="composition" value={form.composition} onChange={handleChange} rows="4" />
                </div>

                <div style={field}>
                    <label>Категория</label>
                    <br />
                    <select name="category" value={form.category} onChange={handleChange}>
                        {categoryOptions.map((x) => (
                            <option key={x.value} value={x.value}>
                                {x.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={field}>
                    <label>Необходимость готовки</label>
                    <br />
                    <select name="cookingType" value={form.cookingType} onChange={handleChange}>
                        {cookingTypeOptions.map((x) => (
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
                            <label>
                                <input
                                    type="checkbox"
                                    checked={form.flags.includes(flag.value)}
                                    onChange={(e) => handleFlagChange(flag.value, e.target.checked)}
                                />
                                {flag.label}
                            </label>
                        </div>
                    ))}
                </div>

                <button type="submit" disabled={isSaving}>
                    {isSaving ? "Сохранение..." : "Сохранить"}
                </button>
            </form>
        </div>
    );
}

const field = {
    marginBottom: "12px"
};