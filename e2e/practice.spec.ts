import { test, expect } from "@playwright/test";

test.describe("Practice mode", () => {
  test("can answer a question and see explanation", async ({ page }) => {
    await page.goto("/exam/aws-sap/practice");

    // Wait for question to load (the QuestionCard renders inside a Card)
    await expect(
      page.locator("[class*='card']").first()
    ).toBeVisible({ timeout: 15000 });

    // Select first option — options are <button> elements with text like "A. ..."
    const options = page.locator("button").filter({ hasText: /^[A-D]\./ });
    await options.first().click();

    // Submit answer
    await page.getByRole("button", { name: /submit answer/i }).click();

    // Should see explanation — ExplanationPanel renders "Correct!" or "Incorrect"
    await expect(
      page.getByText(/correct|incorrect/i).first()
    ).toBeVisible();

    // Should see Next Question (or Finish Practice) button
    await expect(
      page.getByRole("button", { name: /next question|finish practice/i })
    ).toBeVisible();
  });
});
