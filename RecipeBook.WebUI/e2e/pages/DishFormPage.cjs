const { expect } = require("@playwright/test");

class DishFormPage {
    constructor(page) {
        this.page = page;
        this.nameInput = page.locator('input[name="name"]');
        this.portionSizeInput = page.locator('input[name="portionSize"]');
        this.categorySelect = page.locator('select[name="category"]');
        this.ingredientSelect = page.locator("select").last();
        this.amountInput = page.getByPlaceholder("Количество, г");
        this.caloriesInput = page.locator('input[name="calories"]');
        this.saveButton = page.getByRole("button", { name: "Сохранить" });
    }

    async openCreatePage() {
        await this.page.goto("/dishes/create");
    }

    async fillBaseFields(dish) {
        await this.nameInput.fill(dish.name);
        await this.portionSizeInput.fill(String(dish.portionSize));
        await this.categorySelect.selectOption(dish.category);
    }

    async chooseIngredient(productName, amount) {
        await this.ingredientSelect.selectOption({ label: productName });
        await this.amountInput.fill(String(amount));
    }

    async save() {
        await this.saveButton.click();
    }

    async expectCalories(value) {
        await expect(this.caloriesInput).toHaveValue(String(value));
    }

    async expectCategory(value) {
        await expect(this.categorySelect).toHaveValue(value);
    }

    async expectRedirectToDishes() {
        await expect(this.page).toHaveURL(/\/dishes$/);
    }

    async expectEmptyIngredientsError() {
        await expect(this.page.getByText("Нужно добавить хотя бы один продукт в состав.")).toBeVisible();
    }

    async expectPortionSizeInvalid() {
        const isValid = await this.portionSizeInput.evaluate((input) => input.validity.valid);
        expect(isValid).toBe(false);
    }

    async expectFlagEnabled(flagLabel) {
        await expect(this.page.getByLabel(flagLabel)).toBeEnabled();
    }

    async expectFlagDisabled(flagLabel) {
        await expect(this.page.getByLabel(flagLabel)).toBeDisabled();
    }
}

module.exports = {
    DishFormPage
};
