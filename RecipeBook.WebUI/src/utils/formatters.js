export const productCategoryOptions = [
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

export const dishCategoryOptions = [
    { value: "Dessert", label: "Десерт" },
    { value: "FirstCourse", label: "Первое" },
    { value: "SecondCourse", label: "Второе" },
    { value: "Drink", label: "Напиток" },
    { value: "Salad", label: "Салат" },
    { value: "Soup", label: "Суп" },
    { value: "Snack", label: "Перекус" }
];

export const cookingTypeOptions = [
    { value: "ReadyToEat", label: "Готовый к употреблению" },
    { value: "SemiFinished", label: "Полуфабрикат" },
    { value: "RequiresCooking", label: "Требует приготовления" }
];

export const flagOptions = [
    { value: "Vegan", label: "Веган", bit: 1 },
    { value: "GlutenFree", label: "Без глютена", bit: 2 },
    { value: "SugarFree", label: "Без сахара", bit: 4 }
];

export function getProductCategoryLabel(value) {
    return productCategoryOptions.find((x) => x.value === value)?.label || value || "—";
}

export function getDishCategoryLabel(value) {
    return dishCategoryOptions.find((x) => x.value === value)?.label || value || "—";
}

export function getCookingTypeLabel(value) {
    return cookingTypeOptions.find((x) => x.value === value)?.label || value || "—";
}

export function flagsToArray(flags) {
    if (Array.isArray(flags)) {
        return flags;
    }

    if (typeof flags === "number") {
        return flagOptions
            .filter((flag) => (flags & flag.bit) === flag.bit)
            .map((flag) => flag.value);
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

export function flagsToNumber(flagsArray) {
    return flagOptions.reduce((result, flag) => {
        if (flagsArray.includes(flag.value)) {
            return result + flag.bit;
        }

        return result;
    }, 0);
}

export function getFlagsLabel(flags) {
    const values = flagsToArray(flags);

    if (values.length === 0) {
        return "—";
    }

    return values
        .map((value) => flagOptions.find((flag) => flag.value === value)?.label || value)
        .join(", ");
}

export function hasFlag(flags, flagValue) {
    return flagsToArray(flags).includes(flagValue);
}

export function toNumber(value) {
    if (value === "" || value === null || value === undefined) {
        return 0;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}