import { expect, test } from "@playwright/test";

const accents = ["azure", "teal", "amber", "rose", "violet", "lime"];

test.describe("appearance preferences", () => {
  test("follows a light system preference when nothing is stored", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "azure");
    await expect(page.getByRole("radio", { name: "Light" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Azure accent" })).toBeChecked();
  });

  test("follows a dark system preference when nothing is stored", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
  });

  test("persists theme and accent across reloads", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.getByRole("radio", { name: "Dark" }).click();
    await page.getByRole("radio", { name: "Rose accent" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "rose");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "rose");
    await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Rose accent" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Azure accent" })).not.toBeChecked();
  });

  test("keeps a stored light theme even if the system is dark", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.getByRole("radio", { name: "Light" }).click();
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  for (const accent of accents) {
    test(`can select the ${accent} accent`, async ({ page }) => {
      const label = `${accent[0].toUpperCase()}${accent.slice(1)} accent`;
      await page.goto("/");
      await page.getByRole("radio", { name: label }).click();
      await expect(page.locator("html")).toHaveAttribute("data-accent", accent);
      await expect(page.getByRole("radio", { name: label })).toBeChecked();
    });
  }

  test("supports keyboard navigation of theme and accent controls", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.getByRole("radio", { name: "Light" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("radio", { name: "Dark" })).toBeFocused();
    await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();

    await page.getByRole("radio", { name: "Azure accent" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "teal");
    await expect(page.getByRole("radio", { name: "Teal accent" })).toBeFocused();
    await expect(page.getByRole("radio", { name: "Teal accent" })).toBeChecked();
  });

  test("keeps the existing contact links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "hello@integrablue.co.uk" })).toHaveAttribute(
      "href",
      "mailto:hello@integrablue.co.uk",
    );
    await expect(page.getByRole("link", { name: "github.com/jombard" })).toHaveAttribute(
      "href",
      "https://github.com/jombard",
    );
  });
});
