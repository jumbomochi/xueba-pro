import "@testing-library/jest-dom/vitest";

// Node.js 22+ has a built-in localStorage that shadows jsdom's implementation.
// jsdom stores its proper Web Storage API implementation as _localStorage.
// Override globalThis.localStorage so all code uses jsdom's version in tests.
if (
  typeof globalThis !== "undefined" &&
  (globalThis as Record<string, unknown>)._localStorage
) {
  Object.defineProperty(globalThis, "localStorage", {
    value: (globalThis as Record<string, unknown>)._localStorage,
    writable: true,
    configurable: true,
  });
}
