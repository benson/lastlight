import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LASTLIGHT_THEME } from "../themes/lastlight.js";
import { resolveMotionAuditFrame } from "../motion-audit.js";

// BEN-899: Nova's runtime-selected west/east frames did not face the
// requested direction. The normalized atlas builder (tooling/motion_atlas_tool.py)
// bakes a corrected, west-facing pose into the runtime WebP only for physical
// rows listed in an atlas's manifest `flipX` array; every other roster
// specialist that needed a correction listed every physical row its clips
// actually draw from. Nova's manifest entry corrected locomotion, mobility,
// and hurt/down (rows 2-5) but silently omitted the two idle rows (0-1), so
// idle, cast, revive, and victory - which all reuse those idle rows - kept
// baking in the unflipped, wrong-facing source pose for "west" while "east"
// (and south/north) were unaffected. This is a presentation/asset-only
// defect: it never reached combat-orientation.js's angle-based aim/muzzle
// logic or any authoritative simulation state.
const manifestPath = new URL("../tooling/motion-atlas-manifest.json", import.meta.url);

function novaAtlasEntry() {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const nova = manifest.atlases.find((atlas) => atlas.id === "nova");
  assert.ok(nova, "nova must have a motion atlas manifest entry");
  return nova;
}

test("every physical row Nova's specialist clips draw from carries a west-direction flip correction", () => {
  const nova = novaAtlasEntry();
  const rig = LASTLIGHT_THEME.animations.specialists.nova;
  const rowsInUse = new Set();
  for (const clip of Object.values(rig.states)) for (const frame of clip.frames) rowsInUse.add(frame.row);
  assert.ok(rowsInUse.size > 0, "nova rig must declare at least one clip frame");
  const missingWestFlips = [...rowsInUse].sort((a, b) => a - b).filter((row) => {
    const stateName = nova.states[row];
    return !nova.flipX.includes(`${stateName}.west`);
  });
  assert.deepEqual(missingWestFlips, [], `nova.flipX in tooling/motion-atlas-manifest.json is missing west corrections for physical row(s): ${missingWestFlips.join(", ")}`);
});

test("Nova's idle, cast, revive, and victory clips resolve a dedicated west source column consistent with east, south, and north", () => {
  const rig = LASTLIGHT_THEME.animations.specialists.nova;
  for (const requestId of ["idle", "cast-e", "cast-r", "revive", "victory"]) {
    const byDirection = Object.fromEntries(
      ["south", "west", "north", "east"].map((direction) => [direction, resolveMotionAuditFrame({ specialist: "nova", requestId, direction, mode: "normal" })]),
    );
    for (const [direction, frame] of Object.entries(byDirection)) {
      assert.equal(frame.resolvedDirection, direction, `${requestId}/${direction} must resolve the requested atlas column`);
    }
    assert.equal(byDirection.west.resolvedColumn, 1, `${requestId}/west must sample atlas column 1`);
    assert.equal(byDirection.east.resolvedColumn, 3, `${requestId}/east must sample atlas column 3`);
  }
  void rig;
});

test("reverting Nova's idle west/east flip correction is caught by the pinned roster semantics", () => {
  const nova = novaAtlasEntry();
  // The exact defect reported in BEN-899: idle-a/idle-b west flips dropped
  // from the manifest while every other corrected row keeps its flip.
  const regressed = nova.flipX.filter((id) => id !== "idle-a.west" && id !== "idle-b.west");
  assert.notDeepEqual(regressed, nova.flipX, "the fix must add flip entries beyond the pre-existing run/action/hurt-down corrections");
  assert.deepEqual(regressed, ["run-a.west", "run-b.west", "action.west", "hurt-down.west"], "regressing the fix must reproduce the exact pre-BEN-899 flipX list");
});
