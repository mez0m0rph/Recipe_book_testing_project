const { expect } = require("@playwright/test");

class DishesPage {
    constructor(page) {
        this.page = page;
        this.searchInput = page.getByPlaceholder("Поиск по названию");
    }

    async open() {
        await this.page.goto("/dishes");
    }

    async searchByName(name) {
        await this.searchInput.fill(name);
    }

    rowByName(name) {
        return this.page.locator("tbody tr").filter({ hasText: name }).first();
    }

    async expectDishVisible(name) {
        await expect(this.rowByName(name)).toBeVisible();
    }

    async expectRowContains(name, text) {
        await expect(this.rowByName(name)).toContainText(text);
    }
}

module.exports = {
    DishesPage
};
