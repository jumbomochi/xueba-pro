import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("displays certification cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Practice Exams")).toBeVisible();
    await expect(
      page.getByText("AWS Certified Solutions Architect - Professional")
    ).toBeVisible();
    await expect(
      page.getByText("AWS Certified Solutions Architect - Associate")
    ).toBeVisible();
  });

  test("navigates to exam dashboard on card click", async ({ page }) => {
    await page.goto("/");
    await page
      .getByText("AWS Certified Solutions Architect - Professional")
      .click();
    await expect(page).toHaveURL(/\/exam\/aws-sap/);
    await expect(page.getByText("Practice Mode")).toBeVisible();
    await expect(page.getByText("Mock Exam")).toBeVisible();
  });
});
