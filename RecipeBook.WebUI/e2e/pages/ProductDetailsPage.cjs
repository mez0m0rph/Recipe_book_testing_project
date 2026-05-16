const { expect } = require("@playwright/test");

class ProductDetailsPage {
    constructor(page) {
        this.page = page;
        this.title = page.locator("h2");
        this.productImages = page.locator('img[alt^="Фото продукта"]');
    }

    async expectTitleContains(name) {
        await expect(this.title).toContainText(name);
    }

    async expectProductImagesCount(count) {
        await expect(this.productImages).toHaveCount(count);
    }
}

module.exports = {
    ProductDetailsPage
};
