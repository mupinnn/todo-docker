import { test as setup, expect } from "@playwright/test";

type SetupAuth = {
  email: string;
  password: string;
  authStorePath: string;
};

export function setupAuth({ email, password, authStorePath }: SetupAuth) {
  setup.describe.configure({ mode: "serial" });
  setup.describe("Authentication", () => {
    setup("Register", async ({ page }) => {
      await page.goto("/register");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Create account" }).click();
      await page.waitForURL("/login");

      await expect(
        page.getByText("Login to your account", { exact: true }),
      ).toBeVisible();
    });

    setup("Login", async ({ page }) => {
      await page.goto("/login");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Login" }).click();
      await page.waitForURL("/todo");

      await expect(page.getByText("To-Do", { exact: true })).toBeVisible();
      await expect(
        page.getByText("Please, do something.", { exact: true }),
      ).toBeVisible();

      await page.context().storageState({ path: authStorePath });
    });
  });
}
