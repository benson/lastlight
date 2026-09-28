import test from "node:test";
import assert from "node:assert/strict";
import { isFpsShortcut } from "../hotkeys.js";

test("the FPS shortcut uses non-repeating F3 presses only", () => {
  assert.equal(isFpsShortcut({ code: "F3", repeat: false }), true);
  assert.equal(isFpsShortcut({ code: "F3", repeat: true }), false);
  assert.equal(isFpsShortcut({ code: "KeyF", key: "F3", repeat: false }), false);
});
