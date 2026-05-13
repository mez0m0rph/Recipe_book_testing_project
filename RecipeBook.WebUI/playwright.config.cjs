const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./e2e/tests",
    timeout: 30000,
    expect: {
        timeout: 7000
    },
    fullyParallel: false,
    workers: 1,
    reporter: "list",
    use: {
        baseURL: "http://localhost:5173",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure"
    },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"]
            }
        }
    ]
});
