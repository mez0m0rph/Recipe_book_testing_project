import { useEffect, useState } from "react";
import { createProduct, getProduct, updateProduct, uploadFiles } from "../api/api";
import { useNavigate, useParams } from "react-router-dom";
import {
    cookingTypeOptions,
    flagOptions,
    flagsToArray,
    flagsToNumber,
    getFlagsLabel,
    productCategoryOptions,
    toNumber
} from "../utils/formatters";

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

        setForm((prev) => ({
            ...prev,
            [name]: value
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
                return;
            }

            if (payload.photos.length > 5) {
                setError("Можно указать не более 5 фотографий.");
                return;
            }

            if (payload.proteins + payload.fats + payload.carbs > 100) {
                setError("Сумма БЖУ не может превышать 100.");
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
                    <label>Фотографии продукта, максимум 5</label>
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
                                        alt={`Фото продукта ${index + 1}`}
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
                    <label>Калорийность, ккал / 100 г</label>
                    <br />
                    <input type="number" step="0.01" min="0" name="calories" value={form.calories} onChange={handleChange} required />
                </div>

                <div style={field}>
                    <label>Белки, г / 100 г</label>
                    <br />
                    <input type="number" step="0.01" min="0" max="100" name="proteins" value={form.proteins} onChange={handleChange} required />
                </div>

                <div style={field}>
                    <label>Жиры, г / 100 г</label>
                    <br />
                    <input type="number" step="0.01" min="0" max="100" name="fats" value={form.fats} onChange={handleChange} required />
                </div>

                <div style={field}>
                    <label>Углеводы, г / 100 г</label>
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
                        {productCategoryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={field}>
                    <label>Необходимость готовки</label>
                    <br />
                    <select name="cookingType" value={form.cookingType} onChange={handleChange}>
                        {cookingTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={field}>
                    <label>Дополнительные флаги</label>
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
                    <div style={{ marginTop: "6px" }}>
                        Текущие флаги: {getFlagsLabel(flagsToNumber(form.flags))}
                    </div>
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