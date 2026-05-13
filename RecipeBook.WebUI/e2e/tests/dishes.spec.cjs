const { expect, test } = require("@playwright/test");
const { createDishViaUi, searchDishViaUi } = require("../helpers/dishSteps.cjs");
const { createProductViaUi, searchProductViaUi } = require("../helpers/productSteps.cjs");
const { uniqueName } = require("../helpers/testData.cjs");

test.describe("Системные UI-тесты блюд", () => {
    test("CreateDish_ShouldAutomaticallyCalculateCalories_WhenIngredientsAreChanged", async ({ page }) => {
        const productName = uniqueName("Рис");
        const dishName = uniqueName("Рисовая каша");

        await createProductViaUi(page, {
            name: productName,
            calories: 300,
            proteins: 7,
            fats: 1,
            carbs: 70
        });

        await createDishViaUi(page, {
            name: dishName,
            productName: productName,
            amount: 200,
            portionSize: 200,
            category: "Snack",
            expectedCalories: 600
        });

        const row = await searchDishViaUi(page, dishName);

        await expect(row).toContainText(dishName);
        await expect(row).toContainText("600");
    });

    test("CreateDish_ShouldSetCategoryByMacro_WhenNameContainsSoupMacro", async ({ page }) => {
        await page.goto("/dishes/create");

        await page.locator('input[name="name"]').fill(`!суп ${uniqueName("Борщ")}`);

        await expect(page.locator('select[name="category"]')).toHaveValue("Soup");
    });

    test.describe("CreateDish_ShouldValidatePortionSize_BoundaryValues", () => {
        const cases = [
            {
                portionSize: 0,
                shouldBeValid: false
            },
            {
                portionSize: 0.01,
                shouldBeValid: true
            }
        ];

        for (const testCase of cases) {
            test(`portionSize=${testCase.portionSize}`, async ({ page }) => {
                const productName = uniqueName("Овсянка");

                await createProductViaUi(page, {
                    name: productName,
                    calories: 100,
                    proteins: 5,
                    fats: 2,
                    carbs: 20
                });

                await page.goto("/dishes/create");

                await page.locator('input[name="name"]').fill(uniqueName("Порция"));
                await page.locator('input[name="portionSize"]').fill(String(testCase.portionSize));
                await page.locator('select[name="category"]').selectOption("Snack");

                const ingredientSelect = page.locator("select").last();

                await ingredientSelect.selectOption({ label: productName });
                await page.getByPlaceholder("Количество, г").fill("0.01");

                await page.getByRole("button", { name: "Сохранить" }).click();

                if (testCase.shouldBeValid) {
                    await expect(page).toHaveURL(/\/dishes$/);
                } else {
                    const isValid = await page.locator('input[name="portionSize"]').evaluate((input) => input.validity.valid);
                    expect(isValid).toBe(false);
                }
            });
        }
    });

    test("CreateDish_ShouldShowError_WhenIngredientsAreEmpty", async ({ page }) => {
        await page.goto("/dishes/create");

        await page.locator('input[name="name"]').fill(uniqueName("Пустое блюдо"));
        await page.locator('input[name="portionSize"]').fill("100");

        await page.getByRole("button", { name: "Сохранить" }).click();

        await expect(page.getByText("Нужно добавить хотя бы один продукт в состав.")).toBeVisible();
    });

    test("DishFlags_ShouldBeAvailableOnlyWhenAllIngredientsAllowThem", async ({ page }) => {
        const productName = uniqueName("Веганский продукт");

        await createProductViaUi(page, {
            name: productName,
            calories: 100,
            proteins: 5,
            fats: 2,
            carbs: 10,
            flags: ["Веган"]
        });

        await page.goto("/dishes/create");

        await page.locator('input[name="name"]').fill(uniqueName("Флаги блюда"));
        await page.locator('input[name="portionSize"]').fill("100");

        const ingredientSelect = page.locator("select").last();

        await ingredientSelect.selectOption({ label: productName });
        await page.getByPlaceholder("Количество, г").fill("100");

        await expect(page.getByLabel("Веган")).toBeEnabled();
        await expect(page.getByLabel("Без глютена")).toBeDisabled();
        await expect(page.getByLabel("Без сахара")).toBeDisabled();
    });

    test("DeleteProduct_ShouldShowError_WhenProductIsUsedInDish", async ({ page }) => {
        const productName = uniqueName("Мясо");
        const dishName = uniqueName("Блюдо с мясом");

        await createProductViaUi(page, {
            name: productName,
            calories: 250,
            proteins: 20,
            fats: 15,
            carbs: 0
        });

        await createDishViaUi(page, {
            name: dishName,
            productName: productName,
            amount: 100,
            portionSize: 100,
            category: "SecondCourse",
            expectedCalories: 250
        });

        await searchProductViaUi(page, productName);

        const productRow = page.locator("tbody tr").filter({ hasText: productName }).first();

        await expect(productRow).toBeVisible();

        const dialogPromise = page.waitForEvent("dialog");

        await productRow.getByRole("button", { name: "Удалить" }).click();

        const dialog = await dialogPromise;

        expect(dialog.message()).toContain(dishName);

        await dialog.accept();
    });
});
