const { test } = require("@playwright/test");
const { ProductFormPage } = require("../pages/ProductFormPage.cjs");
const { ProductDetailsPage } = require("../pages/ProductDetailsPage.cjs");
const { ProductsPage } = require("../pages/ProductsPage.cjs");
const { createTwoTestImages, uniqueName } = require("../helpers/testData.cjs");

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

test.describe("Системные UI-тесты продуктов через Page Object", () => {
    test("CreateProduct_ShouldCreateProduct_WhenDataIsValid", async ({ page }) => {
        const product = validProduct({
            name: uniqueName("Картофель"),
            calories: 77,
            proteins: 2,
            fats: 0.4,
            carbs: 17
        });

        const productsPage = new ProductsPage(page);

        await createProduct(page, product);
        await productsPage.open();
        await productsPage.searchByName(product.name);
        await productsPage.expectProductVisible(product.name);
    });

    test("CreateProduct_ShouldShowError_WhenNameHasOneCharacter", async ({ page }) => {
        const product = validProduct({
            name: "A"
        });

        const form = new ProductFormPage(page);

        await form.openCreatePage();
        await form.fillRequiredFields(product);
        await form.save();
        await form.expectNameValidationError();
    });

    test("CreateProduct_ShouldCreateProduct_WhenNameHasTwoCharacters", async ({ page }) => {
        const product = validProduct({
            name: "AB"
        });

        const form = new ProductFormPage(page);

        await form.openCreatePage();
        await form.fillRequiredFields(product);
        await form.save();
        await form.expectRedirectToProducts();
    });

    test("CreateProduct_ShouldCreateProduct_WhenPfcSumEquals100", async ({ page }) => {
        const product = validProduct({
            proteins: 40,
            fats: 30,
            carbs: 30
        });

        const form = new ProductFormPage(page);

        await form.openCreatePage();
        await form.fillRequiredFields(product);
        await form.save();
        await form.expectRedirectToProducts();
    });

    test("CreateProduct_ShouldShowError_WhenPfcSumGreaterThan100", async ({ page }) => {
        const product = validProduct({
            proteins: 40,
            fats: 30,
            carbs: 30.01
        });

        const form = new ProductFormPage(page);

        await form.openCreatePage();
        await form.fillRequiredFields(product);
        await form.save();
        await form.expectPfcValidationError();
    });

    test("GetProducts_ShouldSearchProductBySubstringIgnoringCase", async ({ page }) => {
        const product = validProduct({
            name: uniqueName("Свёкла")
        });

        const productsPage = new ProductsPage(page);

        await createProduct(page, product);
        await productsPage.open();
        await productsPage.searchByName("свёк");
        await productsPage.expectTableContainsText("Свёкла");
    });

    test("ProductList_ShouldDisplayRussianLabels_ForCategoryCookingTypeAndFlags", async ({ page }) => {
        const product = validProduct({
            name: uniqueName("Вода"),
            category: "Liquid",
            cookingType: "ReadyToEat"
        });

        const form = new ProductFormPage(page);
        const productsPage = new ProductsPage(page);

        await form.openCreatePage();
        await form.fillRequiredFields(product);
        await form.checkFlag("Без сахара");
        await form.save();
        await form.expectRedirectToProducts();

        await productsPage.open();
        await productsPage.searchByName(product.name);
        await productsPage.expectRowContains(product.name, "Жидкость");
        await productsPage.expectRowContains(product.name, "Готовый к употреблению");
        await productsPage.expectRowContains(product.name, "Без сахара");
    });

    test("CreateProduct_ShouldUploadMultiplePhotos_AndShowThemInProductCard", async ({ page }) => {
        const product = validProduct({
            name: uniqueName("Фото-продукт")
        });

        const photos = createTwoTestImages();

        const form = new ProductFormPage(page);
        const productsPage = new ProductsPage(page);
        const productDetailsPage = new ProductDetailsPage(page);

        await form.openCreatePage();
        await form.fillRequiredFields(product);
        await form.uploadPhotos(photos);
        await form.expectUploadedPhotosCount(2);
        await form.save();
        await form.expectRedirectToProducts();

        await productsPage.open();
        await productsPage.searchByName(product.name);
        await productsPage.openProduct(product.name);

        await productDetailsPage.expectTitleContains(product.name);
        await productDetailsPage.expectProductImagesCount(2);
    });
});
