const { expect } = require("@playwright/test");
const { uniqueName } = require("./testData.cjs");

async function createDishViaUi(page, options) {
    const dish = {
        name: options.name ?? uniqueName("Блюдо"),
        productName: options.productName,
        amount: options.amount ?? 100,
        portionSize: options.portionSize ?? 100,
        category: options.category ?? "Snack",
        expectedCalories: options.expectedCalories
    };

    await page.goto("/dishes/create");

    await page.locator('input[name="name"]').fill(dish.name);
    await page.locator('input[name="portionSize"]').fill(String(dish.portionSize));
    await page.locator('select[name="category"]').selectOption(dish.category);

    const ingredientSelect = page.locator("select").last();

    await ingredientSelect.selectOption({ label: dish.productName });
    await page.getByPlaceholder("Количество, г").fill(String(dish.amount));

    if (dish.expectedCalories !== undefined) {
        await expect(page.locator('input[name="calories"]')).toHaveValue(String(dish.expectedCalories));
    }

    await page.getByRole("button", { name: "Сохранить" }).click();

    await expect(page).toHaveURL(/\/dishes$/);

    return dish;
}

async function searchDishViaUi(page, dishName) {
    await page.goto("/dishes");
    await page.getByPlaceholder("Поиск по названию").fill(dishName);

    const row = page.locator("tbody tr").filter({ hasText: dishName }).first();

    await expect(row).toBeVisible();

    return row;
}

module.exports = {
    createDishViaUi,
    searchDishViaUi
};
