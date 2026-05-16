const { expect } = require("@playwright/test");

class ProductFormPage {
    constructor(page) {
        this.page = page;
        this.nameInput = page.locator('input[name="name"]');
        this.photosInput = page.locator('input[type="file"]');
        this.caloriesInput = page.locator('input[name="calories"]');
        this.proteinsInput = page.locator('input[name="proteins"]');
        this.fatsInput = page.locator('input[name="fats"]');
        this.carbsInput = page.locator('input[name="carbs"]');
        this.compositionInput = page.locator('textarea[name="composition"]');
        this.categorySelect = page.locator('select[name="category"]');
        this.cookingTypeSelect = page.locator('select[name="cookingType"]');
        this.saveButton = page.getByRole("button", { name: "Сохранить" });
    }

    async openCreatePage() {
        await this.page.goto("/products/create");
    }

    async fillRequiredFields(product) {
        await this.nameInput.fill(product.name);
        await this.caloriesInput.fill(String(product.calories));
        await this.proteinsInput.fill(String(product.proteins));
        await this.fatsInput.fill(String(product.fats));
        await this.carbsInput.fill(String(product.carbs));
        await this.compositionInput.fill(product.composition);
        await this.categorySelect.selectOption(product.category);
        await this.cookingTypeSelect.selectOption(product.cookingType);
    }

    async checkFlag(flagLabel) {
        await this.page.getByLabel(flagLabel).check();
    }

    async uploadPhotos(photos) {
        await this.photosInput.setInputFiles(photos);
    }

    async expectUploadedPhotosCount(count) {
        await expect(this.page.getByText(`Выбрано и загружено: ${count} / 5`)).toBeVisible();
    }

    async save() {
        await this.saveButton.click();
    }

    async expectNameValidationError() {
        await expect(this.page.getByText("Название продукта должно содержать минимум 2 символа.")).toBeVisible();
    }

    async expectPfcValidationError() {
        await expect(this.page.getByText("Сумма БЖУ не может превышать 100.")).toBeVisible();
    }

    async expectRedirectToProducts() {
        await expect(this.page).toHaveURL(/\/products$/);
    }
}

module.exports = {
    ProductFormPage
};
