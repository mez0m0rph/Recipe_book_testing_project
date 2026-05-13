const { expect, test } = require("@playwright/test");
const { createProductViaUi, openProductFromList, searchProductViaUi } = require("../helpers/productSteps.cjs");
const { createTwoTestImages, uniqueName } = require("../helpers/testData.cjs");

test.describe("Системные UI-тесты продуктов", () => {
    test("CreateProduct_ShouldCreateProduct_WhenDataIsValid", async ({ page }) => {
        const productName = uniqueName("Картофель");

        await createProductViaUi(page, {
            name: productName,
            calories: 77,
            proteins: 2,
            fats: 0.4,
            carbs: 17
        });

        await searchProductViaUi(page, productName);
    });

    test.describe("CreateProduct_ShouldValidateNameLength_BoundaryValues", () => {
        const cases = [
            {
                name: "A",
                shouldBeValid: false
            },
            {
                name: "AB",
                shouldBeValid: true
            }
        ];

        for (const testCase of cases) {
            test(`name="${testCase.name}"`, async ({ page }) => {
                await page.goto("/products/create");

                await page.locator('input[name="name"]').fill(testCase.name);
                await page.locator('input[name="calories"]').fill("100");
                await page.locator('input[name="proteins"]').fill("10");
                await page.locator('input[name="fats"]').fill("5");
                await page.locator('input[name="carbs"]').fill("20");
                await page.locator('select[name="category"]').selectOption("Vegetables");
                await page.locator('select[name="cookingType"]').selectOption("ReadyToEat");

                await page.getByRole("button", { name: "Сохранить" }).click();

                if (testCase.shouldBeValid) {
                    await expect(page).toHaveURL(/\/products$/);
                } else {
                    await expect(page.getByText("Название продукта должно содержать минимум 2 символа.")).toBeVisible();
                }
            });
        }
    });

    test.describe("CreateProduct_ShouldValidatePfcSum_BoundaryValues", () => {
        const cases = [
            {
                proteins: 40,
                fats: 30,
                carbs: 30,
                shouldBeValid: true
            },
            {
                proteins: 40,
                fats: 30,
                carbs: 30.01,
                shouldBeValid: false
            }
        ];

        for (const testCase of cases) {
            test(`proteins=${testCase.proteins}, fats=${testCase.fats}, carbs=${testCase.carbs}`, async ({ page }) => {
                await page.goto("/products/create");

                await page.locator('input[name="name"]').fill(uniqueName("БЖУ"));
                await page.locator('input[name="calories"]').fill("100");
                await page.locator('input[name="proteins"]').fill(String(testCase.proteins));
                await page.locator('input[name="fats"]').fill(String(testCase.fats));
                await page.locator('input[name="carbs"]').fill(String(testCase.carbs));
                await page.locator('select[name="category"]').selectOption("Vegetables");
                await page.locator('select[name="cookingType"]').selectOption("ReadyToEat");

                await page.getByRole("button", { name: "Сохранить" }).click();

                if (testCase.shouldBeValid) {
                    await expect(page).toHaveURL(/\/products$/);
                } else {
                    await expect(page.getByText("Сумма БЖУ не может превышать 100.")).toBeVisible();
                }
            });
        }
    });

    test("GetProducts_ShouldSearchProductBySubstringIgnoringCase", async ({ page }) => {
        const productName = uniqueName("Свёкла");

        await createProductViaUi(page, {
            name: productName
        });

        await page.goto("/products");
        await page.getByPlaceholder("Поиск по названию").fill("свёк");

        await expect(page.locator("tbody")).toContainText("Свёкла");
    });

    test("ProductList_ShouldDisplayRussianLabels_ForCategoryCookingTypeAndFlags", async ({ page }) => {
        const productName = uniqueName("Вода");

        await createProductViaUi(page, {
            name: productName,
            category: "Liquid",
            cookingType: "ReadyToEat",
            flags: ["Без сахара"]
        });

        const row = await searchProductViaUi(page, productName);

        await expect(row).toContainText("Жидкость");
        await expect(row).toContainText("Готовый к употреблению");
        await expect(row).toContainText("Без сахара");
    });

    test("CreateProduct_ShouldUploadMultiplePhotos_AndShowThemInProductCard", async ({ page }) => {
        const productName = uniqueName("Фото-продукт");
        const photos = createTwoTestImages();

        await createProductViaUi(page, {
            name: productName,
            photos: photos
        });

        await openProductFromList(page, productName);

        await expect(page.locator('img[alt^="Фото продукта"]')).toHaveCount(2);
    });
});
