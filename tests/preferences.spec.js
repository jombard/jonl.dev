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

  test("keeps theme and accent controls in the header bar", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header.topbar");
    await expect(header.getByRole("link", { name: "Jon Lombard" })).toBeVisible();
    await expect(header.getByRole("radio", { name: "Light" })).toBeVisible();
    await expect(header.getByRole("radio", { name: "Azure accent" })).toBeVisible();
    await expect(page.locator("main").getByRole("radio")).toHaveCount(0);
  });

  test("has no em dashes or en dashes in public copy or metadata", async ({ page }) => {
    await page.goto("/");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/[\u2013\u2014]/);
    const metas = await page.locator("title, meta[name='description'], meta[property='og:title'], meta[property='og:description'], meta[name='twitter:title'], meta[name='twitter:description']").all();
    for (const meta of metas) {
      const text = (await meta.textContent()) ?? (await meta.getAttribute("content")) ?? "";
      expect(text).not.toMatch(/[\u2013\u2014]/);
    }
  });

  for (const theme of ["light", "dark"]) {
    for (const accent of accents) {
      test(`headings use contrast-safe ${accent} text in ${theme} theme, not the raw swatch`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: "light" });
        await page.goto("/");
        await page.getByRole("radio", { name: theme === "light" ? "Light" : "Dark" }).click();
        const label = `${accent[0].toUpperCase()}${accent.slice(1)} accent`;
        await page.getByRole("radio", { name: label }).click();

        const colours = await page.locator("h1").evaluate((el) => {
          const styles = getComputedStyle(el);
          return {
            heading: styles.color,
            accentText: styles.getPropertyValue("--accent-text").trim(),
            swatch: styles.getPropertyValue("--accent-swatch").trim(),
          };
        });

        const headingRgb = await page.locator("h1").evaluate((el, hex) => {
          const probe = document.createElement("span");
          probe.style.color = hex;
          document.body.append(probe);
          const rgb = getComputedStyle(probe).color;
          probe.remove();
          return rgb;
        }, colours.accentText);

        const swatchRgb = await page.locator("h1").evaluate((el, hex) => {
          const probe = document.createElement("span");
          probe.style.color = hex;
          document.body.append(probe);
          const rgb = getComputedStyle(probe).color;
          probe.remove();
          return rgb;
        }, colours.swatch);

        expect(colours.heading).toBe(headingRgb);
        if (accent === "amber" || accent === "lime" || accent === "teal") {
          expect(colours.heading).not.toBe(swatchRgb);
        }

        const nameColour = await page.locator(".site-name").evaluate((el) => getComputedStyle(el).color);
        expect(nameColour).toBe(headingRgb);
      });
    }
  }

  test("header bar stays usable at a mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const header = page.locator("header.topbar");
    await expect(header.getByRole("radio", { name: "Light" })).toBeVisible();
    await expect(header.getByRole("radio", { name: "Lime accent" })).toBeVisible();
    const box = await header.boundingBox();
    expect(box).toBeTruthy();
    expect(box?.height ?? 99).toBeLessThan(120);
    await header.getByRole("radio", { name: "Dark" }).click();
    await header.getByRole("radio", { name: "Violet accent" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "violet");
  });
});
