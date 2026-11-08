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

  test("uses a name-led hero, original intro, grouped technical experience, and contact", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: "Jon Lombard" })).toBeVisible();
    await expect(page.locator(".hero-role")).toHaveText("Independent Senior Developer");
    await expect(page.getByText("I enjoy learning the system you already have")).toHaveCount(0);
    await expect(page.locator("main > p").first()).toHaveText(
      "I am a developer with 2 decades of experience working in global organisations delivering high quality products.",
    );
    await expect(page.getByText("Welcome to my website")).toHaveCount(0);
    await expect(page.locator("main > p").nth(1)).toHaveText(
      "I have worked in a global organisation, delivering a number of projects for stakeholders at all levels and all manner of deadlines.",
    );
    await expect(page.getByText("I enjoy learning my way into a codebase")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Technical experience" })).toBeVisible();
    await expect(page.getByText("A selection of tools I've used in production.")).toBeVisible();
    await expect(page.getByText("I'm happy to learn new tools.")).toBeVisible();
    await expect(page.getByText("I want to understand the problem first, then choose the technology that fits.")).toBeVisible();
    await expect(page.getByText("picking up a system I haven't used in a while")).toHaveCount(0);
    await expect(page.locator("dd").filter({ hasText: /Python/ })).toBeVisible();
    await expect(page.locator("dd").filter({ hasText: /Angular, React/ })).toBeVisible();
    await expect(page.locator("dd").filter({ hasText: /\.NET \/ C#/ })).toBeVisible();
    await expect(page.getByText(/through \.NET 8/)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Discuss your project" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Discuss your project" })).toHaveAttribute(
      "href",
      "mailto:hello@integrablue.co.uk",
    );
    await expect(page.getByText("I'm interested in long-term involvement")).toBeVisible();
    await expect(page.getByText("I'm open to contract work and technical partnerships")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Some of the work" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Coding with agents" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Outside work" })).toHaveCount(0);
    await expect(page.getByText("software factory")).toHaveCount(0);
    await expect(page.getByText("spaghetti codebases")).toHaveCount(0);
    await expect(
      page.getByText("I recently started learning piano and have taken up the historic game of Real Tennis."),
    ).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /case study/i })).toHaveCount(0);
    await expect(page.getByText(/£10k|10,000|zero downtime/i)).toHaveCount(0);
  });

  test("keeps only theme and accent controls in the desktop header", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const header = page.locator("header.topbar");
    await expect(header.getByRole("link")).toHaveCount(0);
    await expect(header.getByRole("heading")).toHaveCount(0);
    await expect(header).not.toContainText("Jon Lombard");
    await expect(header.getByRole("button", { name: "Appearance" })).toBeHidden();
    await expect(header.getByRole("radio", { name: "Light" })).toBeVisible();
    await expect(header.getByRole("radio", { name: "Azure accent" })).toBeVisible();
    await expect(header.getByText("Theme", { exact: true })).toBeVisible();
    await expect(page.locator("main").getByRole("radio")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
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

        const h2Colour = await page.locator("h2").first().evaluate((el) => getComputedStyle(el).color);
        expect(h2Colour).toBe(headingRgb);
      });
    }
  }

  test("hides appearance controls behind a closed menu on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const header = page.locator("header.topbar");
    const toggle = header.getByRole("button", { name: "Appearance" });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(header.getByRole("radio", { name: "Light" })).toBeHidden();
    await expect(header.getByRole("radio", { name: "Azure accent" })).toBeHidden();
    const closedBox = await header.boundingBox();
    expect(closedBox?.height ?? 99).toBeLessThan(80);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  });

  test("opens mobile appearance controls, changes them, and keeps them after close and reopen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const header = page.locator("header.topbar");
    const toggle = header.getByRole("button", { name: "Appearance" });

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(header.getByRole("radio", { name: "Light" })).toBeVisible();
    await expect(header.getByRole("radio", { name: "Azure accent" })).toBeVisible();
    await expect(header.getByText("Theme", { exact: true })).toBeVisible();
    await expect(header.getByText("Accent", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);

    await header.getByRole("radio", { name: "Dark" }).click();
    await header.getByRole("radio", { name: "Violet accent" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "violet");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(header.getByRole("radio", { name: "Dark" })).toBeHidden();

    await toggle.click();
    await expect(header.getByRole("radio", { name: "Dark" })).toBeChecked();
    await expect(header.getByRole("radio", { name: "Violet accent" })).toBeChecked();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "violet");
    await expect(page.getByRole("button", { name: "Appearance" })).toHaveAttribute("aria-expanded", "false");
  });

  test("closes the mobile appearance menu with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Appearance" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    await expect(page.getByRole("radio", { name: "Light" })).toBeHidden();
  });
});
