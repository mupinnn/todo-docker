import { test, expect } from "@playwright/test";

test("Should be able to go to profile page", async ({ page }) => {
  const profileResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/profile") && response.status() === 200,
  );

  await page.goto("/todo");
  await page.getByRole("tab", { name: "Profile" }).click();
  await page.waitForURL("/profile");

  const profileResponse = await profileResponsePromise;
  const profile = (await profileResponse.json()) as {
    profile: { email: string };
  };

  await expect(
    page.getByText(`Hello, ${profile.profile.email}!`),
  ).toBeVisible();
});

test("Should be able to sign out from current session", async ({ page }) => {
  await page.goto("/profile");
  await page.getByTestId("sessions-skeleton").waitFor({ state: "hidden" });

  await expect(page.getByText("Current session")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.context().clearCookies();
  await page.waitForURL("/login", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByText("Login to your account", { exact: true }),
  ).toBeVisible();
});
