function uniqueName(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTestImageFile(name) {
    const base64Png =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

    return {
        name,
        mimeType: "image/png",
        buffer: Buffer.from(base64Png, "base64")
    };
}

function createTwoTestImages() {
    return [
        createTestImageFile(`photo-1-${Date.now()}.png`),
        createTestImageFile(`photo-2-${Date.now()}.png`)
    ];
}

module.exports = {
    uniqueName,
    createTwoTestImages
};
