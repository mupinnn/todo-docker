import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.goto("/todo");
});

test("Should check todo is empty", async ({ page }) => {
  await expect(
    page.getByText("Nothing todo yet", { exact: true }),
  ).toBeVisible();
});

test("Should add new tasks", async ({ page }) => {
  await page.getByRole("textbox", { name: "task" }).fill("Go shopping");
  await page.getByRole("button", { name: "Add" }).click();

  await page.getByRole("textbox", { name: "task" }).fill("Workout");
  await page.getByRole("button", { name: "Add" }).click();

  await page.getByRole("textbox", { name: "task" }).fill("Fix air conditioner");
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByTestId("todo-list").locator("> *")).toHaveCount(3);
});

test("Should be able to check one of the tasks", async ({ page }) => {
  await page.getByTestId("todo-skeleton").waitFor({ state: "hidden" });

  const taskList = page.getByTestId("todo-list");
  const taskCheckboxes = taskList.locator("[role=checkbox]");
  const taskCheckboxesCount = await taskCheckboxes.count();

  for (let i = 0; i < taskCheckboxesCount; i++) {
    const checkbox = taskCheckboxes.nth(i);
    const isChecked = (await checkbox.getAttribute("data-state")) === "checked";

    if (!isChecked) {
      await checkbox.click();
    }

    await expect(checkbox).toHaveAttribute("data-state", "checked");
  }
});

test("Should be able to delete one of the tasks", async ({ page }) => {
  await page.getByTestId("todo-skeleton").waitFor({ state: "hidden" });

  const taskList = page.getByTestId("todo-list");
  const taskDeleteButtons = taskList.getByRole("button");
  const taskDeleteButtonsCount = await taskDeleteButtons.count();

  for (let i = 0; i < taskDeleteButtonsCount; i++) {
    const deleteButton = taskDeleteButtons.nth(taskDeleteButtonsCount - i - 1);

    await deleteButton.click();
    await expect(taskList.locator("> *")).toHaveCount(
      taskDeleteButtonsCount - i - 1,
    );
  }
});
