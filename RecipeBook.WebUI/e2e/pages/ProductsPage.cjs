const { expect } = require("@playwright/test");

class ProductsPage {
    constructor(page) {
        this.page = page;
        this.searchInput = page.getByPlaceholder("Поиск по названию");
        this.tableBody = page.locator("tbody");
    }

    async open() {
        await this.page.goto("/products");
    }

    async searchByName(name) {
        await this.searchInput.fill(name);
    }

    rowByName(name) {
        return this.page.locator("tbody tr").filter({ hasText: name }).first();
    }

    async expectProductVisible(name) {
        await expect(this.rowByName(name)).toBeVisible();
    }

    async expectTableContainsText(text) {
        await expect(this.tableBody).toContainText(text);
    }

    async openProduct(name) {
        const row = this.rowByName(name);
        await row.getByRole("link", { name: "Открыть" }).click();
    }

    async deleteProduct(name) {
        const row = this.rowByName(name);
        await row.getByRole("button", { name: "Удалить" }).click();
    }

    async expectRowContains(name, text) {
        await expect(this.rowByName(name)).toContainText(text);
    }
}

module.exports = {
    ProductsPage
};
