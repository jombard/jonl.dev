/** @typedef {"light" | "dark"} Theme */
/** @typedef {"azure" | "teal" | "amber" | "rose" | "violet" | "lime"} Accent */

export const THEME_KEY = "jonl.dev:theme";
export const ACCENT_KEY = "jonl.dev:accent";

/** @type {readonly Theme[]} */
export const THEMES = ["light", "dark"];

/** @type {readonly Accent[]} */
export const ACCENTS = ["azure", "teal", "amber", "rose", "violet", "lime"];

/** @type {Accent} */
export const DEFAULT_ACCENT = "azure";

/**
 * @param {unknown} value
 * @returns {value is Theme}
 */
export function isTheme(value) {
  return value === "light" || value === "dark";
}

/**
 * @param {unknown} value
 * @returns {value is Accent}
 */
export function isAccent(value) {
  return ACCENTS.includes(/** @type {Accent} */ (value));
}

/**
 * @param {Pick<Storage, "getItem">} storage
 * @returns {Theme | null}
 */
export function readStoredTheme(storage) {
  try {
    const value = storage.getItem(THEME_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * @param {Pick<Storage, "getItem">} storage
 * @returns {Accent | null}
 */
export function readStoredAccent(storage) {
  try {
    const value = storage.getItem(ACCENT_KEY);
    return isAccent(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * @param {Theme | null} stored
 * @param {boolean} systemDark
 * @returns {Theme}
 */
export function resolveTheme(stored, systemDark) {
  if (stored) {
    return stored;
  }
  return systemDark ? "dark" : "light";
}

/**
 * @param {Accent | null} stored
 * @returns {Accent}
 */
export function resolveAccent(stored) {
  return stored ?? DEFAULT_ACCENT;
}

/**
 * @param {object} options
 * @param {Theme} options.theme
 * @param {Accent} options.accent
 * @param {HTMLElement} options.root
 */
export function applyAppearance({ theme, accent, root }) {
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-accent", accent);
  root.style.colorScheme = theme;
}

/**
 * @param {Theme} theme
 * @param {Pick<Storage, "setItem">} storage
 */
export function persistTheme(theme, storage) {
  storage.setItem(THEME_KEY, theme);
}

/**
 * @param {Accent} accent
 * @param {Pick<Storage, "setItem">} storage
 */
export function persistAccent(accent, storage) {
  storage.setItem(ACCENT_KEY, accent);
}

/**
 * @param {MediaQueryList | { matches: boolean } | null | undefined} media
 * @returns {boolean}
 */
export function systemPrefersDark(media) {
  return Boolean(media && media.matches);
}

/**
 * @param {ParentNode} root
 * @param {string} selector
 * @param {string} value
 */
function syncChecked(root, selector, value) {
  root.querySelectorAll(selector).forEach((node) => {
    if (node instanceof HTMLInputElement) {
      node.checked = node.value === value;
    }
  });
}

/**
 * @param {object} [options]
 * @param {HTMLElement} [options.root]
 * @param {ParentNode} [options.controls]
 * @param {Pick<Storage, "getItem" | "setItem">} [options.storage]
 * @param {Pick<Window, "matchMedia" | "getComputedStyle">} [options.windowObject]
 * @returns {{ theme: Theme, accent: Accent }}
 */
export function initAppearance(options = {}) {
  const root = options.root ?? document.documentElement;
  const controls = options.controls ?? document;
  const storage = options.storage ?? window.localStorage;
  const windowObject = options.windowObject ?? window;
  const media = windowObject.matchMedia
    ? windowObject.matchMedia("(prefers-color-scheme: dark)")
    : { matches: false };

  let theme = resolveTheme(readStoredTheme(storage), systemPrefersDark(media));
  let accent = resolveAccent(readStoredAccent(storage));

  const paint = () => {
    applyAppearance({ theme, accent, root });
    syncChecked(controls, 'input[name="theme"]', theme);
    syncChecked(controls, 'input[name="accent"]', accent);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor && windowObject.getComputedStyle) {
      const bg = windowObject.getComputedStyle(root).getPropertyValue("--bg").trim();
      if (bg) {
        themeColor.setAttribute("content", bg);
      }
    }
  };

  /** @param {Theme} next */
  const setTheme = (next) => {
    theme = next;
    persistTheme(theme, storage);
    paint();
  };

  /** @param {Accent} next */
  const setAccent = (next) => {
    accent = next;
    persistAccent(accent, storage);
    paint();
  };

  controls.querySelectorAll('input[name="theme"]').forEach((node) => {
    node.addEventListener("change", () => {
      if (node instanceof HTMLInputElement && node.checked && isTheme(node.value)) {
        setTheme(node.value);
      }
    });
  });

  controls.querySelectorAll('input[name="accent"]').forEach((node) => {
    node.addEventListener("change", () => {
      if (node instanceof HTMLInputElement && node.checked && isAccent(node.value)) {
        setAccent(node.value);
      }
    });
  });

  if (media && "addEventListener" in media) {
    media.addEventListener("change", (event) => {
      if (readStoredTheme(storage)) {
        return;
      }
      theme = resolveTheme(null, event.matches);
      paint();
    });
  }

  paint();
  return { theme, accent };
}
