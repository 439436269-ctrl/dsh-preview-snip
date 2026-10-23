import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("the bundle registers the document-preview action", async () => {
  const source = await readFile(new URL("../lib/client.js", import.meta.url), "utf8");
  let registration;
  const captured = [];
  const React = {
    createElement: () => ({}),
    Fragment: {},
    useState: () => [false, () => {}],
    useEffect: () => {},
    useRef: () => ({ current: null })
  };
  const document = {
    getElementById: () => null,
    createElement: () => ({ id: "", textContent: "" }),
    head: { appendChild: () => {} }
  };
  const window = {
    __ModuleLoader__: {
      load: (value) => {
        registration = value;
      }
    }
  };
  const context = vm.createContext({
    window,
    document,
    console,
    globalThis: {}
  });
  vm.runInContext(source, context);
  assert.equal(registration.id, "dsh-preview-snip");
  const module = registration.factory((name) => {
    if (name === "react") return React;
    throw new Error(`unexpected require ${name}`);
  });
  const ctx = {
    locale: { bind: () => (key) => key, register: () => ({}) },
    effect: (fn) => {
      fn();
      return () => {};
    },
    sessions: { scope: () => ({ get: () => ({ createDrafts: () => [] }) }) },
    slots: {
      inject: (_name, fn) => {
        fn();
      },
      register: (spec) => {
        captured.push(spec);
        return () => {};
      }
    }
  };
  module.apply(ctx);
  assert.equal(captured.length, 1);
  assert.equal(captured[0].name, "sidebar.right.tab.document.actions");
  assert.equal(captured[0].id, "preview-snip");
  assert.equal(typeof captured[0].inject, "function");
});
