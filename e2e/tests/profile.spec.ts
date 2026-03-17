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
