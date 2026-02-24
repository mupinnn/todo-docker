import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText("Login to your account", { exact: true }),
  ).toBeVisible({
    timeout: 15_000,
  });
});
