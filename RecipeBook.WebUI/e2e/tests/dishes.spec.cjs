const { test } = require("@playwright/test");
const { DishFormPage } = require("../pages/DishFormPage.cjs");
const { DishesPage } = require("../pages/DishesPage.cjs");
const { ProductFormPage } = require("../pages/ProductFormPage.cjs");
const { ProductsPage } = require("../pages/ProductsPage.cjs");
const { uniqueName } = require("../helpers/testData.cjs");

function validProduct(overrides = {}) {
    return {
        name: uniqueName("Продукт"),
        calories: 100,
        proteins: 10,
        fats: 5,
        carbs: 20,
        composition: "Тестовый состав",
        category: "Vegetables",
        cookingType: "ReadyToEat",
        ...overrides
    };
}

async function createProduct(page, product) {
    const form = new ProductFormPage(page);

    await form.openCreatePage();
    await form.fillRequiredFields(product);
    await form.save();
    await form.expectRedirectToProducts();
}

async function createDish(page, dish) {
    const form = new DishFormPage(page);

    await form.openCreatePage();
    await form.fillBaseFields(dish);
    await form.chooseIngredient(dish.productName, dish.amount);
    await form.expectCalories(dish.expectedCalories);
    await form.save();
    await form.expectRedirectToDishes();
}

test.describe("Системные UI-тесты блюд через Page Object", () => {
    test("CreateDish_ShouldAutomaticallyCalculateCalories_WhenIngredientsAreChanged", async ({ page }) => {
        const product = validProduct({
            name: uniqueName("Рис"),
            calories: 300,
            proteins: 7,
            fats: 1,
            carbs: 70
        });

        const dish = {
            name: uniqueName("Рисовая каша"),
            productName: product.name,
            amount: 200,
            portionSize: 200,
            category: "Snack",
            expectedCalories: 600
        };

        const dishesPage = new DishesPage(page);

        await createProduct(page, product);
        await createDish(page, dish);

        await dishesPage.open();
        await dishesPage.searchByName(dish.name);
        await dishesPage.expectDishVisible(dish.name);
        await dishesPage.expectRowContains(dish.name, "600");
    });

    test("CreateDish_ShouldSetCategoryByMacro_WhenNameContainsSoupMacro", async ({ page }) => {
        const form = new DishFormPage(page);

        await form.openCreatePage();
        await form.nameInput.fill(`!суп ${uniqueName("Борщ")}`);
        await form.expectCategory("Soup");
    });

    test("CreateDish_ShouldShowError_WhenPortionSizeEqualsZero", async ({ page }) => {
        const product = validProduct({
            name: uniqueName("Овсянка")
        });

        const form = new DishFormPage(page);

        await createProduct(page, product);

        await form.openCreatePage();
        await form.fillBaseFields({
            name: uniqueName("Порция"),
            portionSize: 0,
            category: "Snack"
        });
        await form.chooseIngredient(product.name, 0.01);
        await form.save();
        await form.expectPortionSizeInvalid();
    });

    test("CreateDish_ShouldCreateDish_WhenPortionSizeEqualsMinimalPositiveValue", async ({ page }) => {
        const product = validProduct({
            name: uniqueName("Овсянка")
        });

        const form = new DishFormPage(page);

        await createProduct(page, product);

        await form.openCreatePage();
        await form.fillBaseFields({
            name: uniqueName("Порция"),
            portionSize: 0.01,
            category: "Snack"
        });
        await form.chooseIngredient(product.name, 0.01);
        await form.save();
        await form.expectRedirectToDishes();
    });

    test("CreateDish_ShouldShowError_WhenIngredientsAreEmpty", async ({ page }) => {
        const form = new DishFormPage(page);

        await form.openCreatePage();
        await form.fillBaseFields({
            name: uniqueName("Пустое блюдо"),
            portionSize: 100,
            category: "Snack"
        });
        await form.save();
        await form.expectEmptyIngredientsError();
    });

    test("DishFlags_ShouldBeAvailableOnlyWhenAllIngredientsAllowThem", async ({ page }) => {
        const product = validProduct({
            name: uniqueName("Веганский продукт")
        });

        const productForm = new ProductFormPage(page);
        const dishForm = new DishFormPage(page);

        await productForm.openCreatePage();
        await productForm.fillRequiredFields(product);
        await productForm.checkFlag("Веган");
        await productForm.save();
        await productForm.expectRedirectToProducts();

        await dishForm.openCreatePage();
        await dishForm.fillBaseFields({
            name: uniqueName("Флаги блюда"),
            portionSize: 100,
            category: "Snack"
        });
        await dishForm.chooseIngredient(product.name, 100);

        await dishForm.expectFlagEnabled("Веган");
        await dishForm.expectFlagDisabled("Без глютена");
        await dishForm.expectFlagDisabled("Без сахара");
    });

    test("DeleteProduct_ShouldShowError_WhenProductIsUsedInDish", async ({ page }) => {
        const product = validProduct({
            name: uniqueName("Мясо"),
            calories: 250,
            proteins: 20,
            fats: 15,
            carbs: 0
        });

        const dish = {
            name: uniqueName("Блюдо с мясом"),
            productName: product.name,
            amount: 100,
            portionSize: 100,
            category: "SecondCourse",
            expectedCalories: 250
        };

        const productsPage = new ProductsPage(page);

        await createProduct(page, product);
        await createDish(page, dish);

        await productsPage.open();
        await productsPage.searchByName(product.name);
        await productsPage.expectProductVisible(product.name);

        const dialogPromise = page.waitForEvent("dialog");

        await productsPage.deleteProduct(product.name);

        const dialog = await dialogPromise;

        await dialog.accept();
    });
});
