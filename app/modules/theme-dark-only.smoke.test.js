const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const dashboardHtml = fs.readFileSync(require.resolve("../dashboard.html"), "utf8");
assert.match(dashboardHtml, /document\.documentElement\.setAttribute\("data-theme", "dark"\)/);
assert.match(dashboardHtml, /class="theme-choice-row"[^>]+aria-hidden="true" hidden/);
assert.match(dashboardHtml, /data-theme-choice="light"[^>]+hidden disabled/);
assert.match(dashboardHtml, /data-theme-choice="dark"[^>]+hidden disabled/);

function createElement(themeChoice) {
  const attributes = new Map([["data-theme-choice", themeChoice]]);
  return {
    hidden: false,
    disabled: false,
    classList: {
      active: false,
      toggle(_name, active) { this.active = active; }
    },
    getAttribute(name) { return attributes.get(name); },
    setAttribute(name, value) { attributes.set(name, value); }
  };
}

const html = { attributes: new Map(), setAttribute(name, value) { this.attributes.set(name, value); } };
const body = { attributes: new Map(), setAttribute(name, value) { this.attributes.set(name, value); } };
const lightChoice = createElement("light");
const darkChoice = createElement("dark");
const listeners = new Map();
const storage = new Map([["rrll_theme", "light"]]);
const context = {
  window: {},
  localStorage: {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, value); }
  },
  document: {
    documentElement: html,
    body,
    querySelectorAll(selector) { return selector === "[data-theme-choice]" ? [lightChoice, darkChoice] : []; },
    addEventListener(name, callback) { listeners.set(name, callback); }
  }
};

vm.runInNewContext(fs.readFileSync(require.resolve("./theme"), "utf8"), context);

assert.equal(html.attributes.get("data-theme"), "dark");
assert.equal(body.attributes.get("data-theme"), "dark");
assert.equal(storage.get("rrll_theme"), "dark");
assert.equal(context.window.getRRLLTheme(), "dark");
assert.equal(lightChoice.hidden, true);
assert.equal(lightChoice.disabled, true);
assert.equal(lightChoice.classList.active, false);
assert.equal(darkChoice.hidden, true);
assert.equal(darkChoice.disabled, true);
assert.equal(darkChoice.classList.active, true);

context.window.setRRLLTheme("light");
assert.equal(context.window.getRRLLTheme(), "dark");
assert.equal(html.attributes.get("data-theme"), "dark");
assert.equal(body.attributes.get("data-theme"), "dark");
assert.equal(storage.get("rrll_theme"), "dark");

listeners.get("DOMContentLoaded")();
assert.equal(storage.get("rrll_theme"), "dark");

console.log("theme dark-only smoke test passed");
