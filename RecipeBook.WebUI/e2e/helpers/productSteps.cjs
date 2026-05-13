const { expect } = require("@playwright/test");
const { uniqueName } = require("./testData.cjs");

async function createProductViaUi(page, options = {}) {
    const product = {
        name: options.name ?? uniqueName("Продукт"),
        calories: options.calories ?? 100,
        proteins: options.proteins ?? 10,
        fats: options.fats ?? 5,
        carbs: options.carbs ?? 20,
        composition: options.composition ?? "Тестовый состав",
        category: options.category ?? "Vegetables",
        cookingType: options.cookingType ?? "ReadyToEat",
        flags: options.flags ?? [],
        photos: options.photos ?? []
    };

    await page.goto("/products/create");

    await page.locator('input[name="name"]').fill(product.name);

    if (product.photos.length > 0) {
        await page.locator('input[type="file"]').setInputFiles(product.photos);
        await expect(page.getByText(`Выбрано и загружено: ${product.photos.length} / 5`)).toBeVisible();
    }

    await page.locator('input[name="calories"]').fill(String(product.calories));
    await page.locator('input[name="proteins"]').fill(String(product.proteins));
    await page.locator('input[name="fats"]').fill(String(product.fats));
    await page.locator('input[name="carbs"]').fill(String(product.carbs));
    await page.locator('textarea[name="composition"]').fill(product.composition);
    await page.locator('select[name="category"]').selectOption(product.category);
    await page.locator('select[name="cookingType"]').selectOption(product.cookingType);

    for (const flagLabel of product.flags) {
        await page.getByLabel(flagLabel).check();
    }

    await page.getByRole("button", { name: "Сохранить" }).click();

    await expect(page).toHaveURL(/\/products$/);

    return product;
}

async function searchProductViaUi(page, productName) {
    await page.goto("/products");
    await page.getByPlaceholder("Поиск по названию").fill(productName);

    const row = page.locator("tbody tr").filter({ hasText: productName }).first();

    await expect(row).toBeVisible();

    return row;
}

async function openProductFromList(page, productName) {
    const row = await searchProductViaUi(page, productName);

    await row.getByRole("link", { name: "Открыть" }).click();

    await expect(page.locator("h2")).toContainText(productName);
}

module.exports = {
    createProductViaUi,
    searchProductViaUi,
    openProductFromList
};
