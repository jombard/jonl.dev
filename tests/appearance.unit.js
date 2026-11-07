import { afterEach, describe, expect, it } from "vitest";
import {
  ACCENT_KEY,
  ACCENTS,
  DEFAULT_ACCENT,
  THEME_KEY,
  applyAppearance,
  initAppearance,
  isAccent,
  isTheme,
  persistAccent,
  persistTheme,
  readStoredAccent,
  readStoredTheme,
  resolveAccent,
  resolveTheme,
} from "../appearance.js";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    dump: data,
  };
}

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-accent");
  document.body.innerHTML = "";
});

describe("appearance helpers", () => {
  it("accepts only light and dark themes", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it("accepts only known accents", () => {
    for (const accent of ACCENTS) {
      expect(isAccent(accent)).toBe(true);
    }
    expect(isAccent("neon")).toBe(false);
    expect(isAccent("blue")).toBe(false);
  });

  it("uses the system preference when nothing is stored", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });

  it("prefers a stored theme over the system preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("falls back to azure when no accent is stored", () => {
    expect(resolveAccent(null)).toBe(DEFAULT_ACCENT);
    expect(resolveAccent("rose")).toBe("rose");
  });

  it("ignores invalid stored values", () => {
    const storage = memoryStorage({
      [THEME_KEY]: "dim",
      [ACCENT_KEY]: "chartreuse",
    });
    expect(readStoredTheme(storage)).toBeNull();
    expect(readStoredAccent(storage)).toBeNull();
  });

  it("reads and persists valid values", () => {
    const storage = memoryStorage();
    persistTheme("dark", storage);
    persistAccent("lime", storage);
    expect(readStoredTheme(storage)).toBe("dark");
    expect(readStoredAccent(storage)).toBe("lime");
    expect(storage.dump[THEME_KEY]).toBe("dark");
    expect(storage.dump[ACCENT_KEY]).toBe("lime");
  });

  it("applies a single theme and accent to the root element", () => {
    const root = document.documentElement;
    applyAppearance({ theme: "dark", accent: "violet", root });
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.getAttribute("data-accent")).toBe("violet");
    expect(root.style.colorScheme).toBe("dark");
  });
});

describe("initAppearance", () => {
  function mountControls() {
    document.body.innerHTML = `
      <div id="controls">
        <label><input type="radio" name="theme" value="light"> Light</label>
        <label><input type="radio" name="theme" value="dark"> Dark</label>
        <label><input type="radio" name="accent" value="azure"> Azure accent</label>
        <label><input type="radio" name="accent" value="teal"> Teal accent</label>
        <label><input type="radio" name="accent" value="amber"> Amber accent</label>
      </div>
    `;
    return document.getElementById("controls");
  }

  it("initialises from system preference and default accent", () => {
    const controls = mountControls();
    const storage = memoryStorage();
    const result = initAppearance({
      root: document.documentElement,
      controls,
      storage,
      windowObject: {
        matchMedia: () => ({ matches: true, addEventListener() {} }),
        getComputedStyle: () => ({ getPropertyValue: () => "#161513" }),
      },
    });
    expect(result).toEqual({ theme: "dark", accent: "azure" });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-accent")).toBe("azure");
    expect(controls.querySelector('input[name="theme"][value="dark"]')?.checked).toBe(true);
    expect(controls.querySelector('input[name="theme"][value="light"]')?.checked).toBe(false);
    expect(controls.querySelector('input[name="accent"][value="azure"]')?.checked).toBe(true);
  });

  it("restores stored theme and accent", () => {
    const controls = mountControls();
    const storage = memoryStorage({
      [THEME_KEY]: "light",
      [ACCENT_KEY]: "teal",
    });
    initAppearance({
      root: document.documentElement,
      controls,
      storage,
      windowObject: {
        matchMedia: () => ({ matches: true, addEventListener() {} }),
        getComputedStyle: () => ({ getPropertyValue: () => "#f6f4ef" }),
      },
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-accent")).toBe("teal");
    expect(controls.querySelector('input[name="accent"][value="teal"]')?.checked).toBe(true);
    expect(controls.querySelector('input[name="accent"][value="azure"]')?.checked).toBe(false);
  });

  it("persists a newly chosen theme and accent, one accent at a time", () => {
    const controls = mountControls();
    const storage = memoryStorage();
    initAppearance({
      root: document.documentElement,
      controls,
      storage,
      windowObject: {
        matchMedia: () => ({ matches: false, addEventListener() {} }),
        getComputedStyle: () => ({ getPropertyValue: () => "#f6f4ef" }),
      },
    });

    const dark = controls.querySelector('input[name="theme"][value="dark"]');
    const amber = controls.querySelector('input[name="accent"][value="amber"]');
    if (!(dark instanceof HTMLInputElement) || !(amber instanceof HTMLInputElement)) {
      throw new Error("expected radio inputs");
    }
    dark.checked = true;
    dark.dispatchEvent(new Event("change", { bubbles: true }));
    amber.checked = true;
    amber.dispatchEvent(new Event("change", { bubbles: true }));

    expect(readStoredTheme(storage)).toBe("dark");
    expect(readStoredAccent(storage)).toBe("amber");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-accent")).toBe("amber");
    expect(controls.querySelectorAll('input[name="accent"]:checked')).toHaveLength(1);
  });
});
