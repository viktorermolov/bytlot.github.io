import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_ASSUMPTIONS } from "../js/calculations.js";
import {
  SETTINGS_STORAGE_KEY,
  assumptionState,
  readSettings,
  writeSettings
} from "../js/settings.js";

function storageWith(value) {
  return {
    getItem(key) {
      assert.equal(key, SETTINGS_STORAGE_KEY);
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, SETTINGS_STORAGE_KEY);
      value = nextValue;
    },
    value() {
      return value;
    }
  };
}

test("readSettings safely falls back for corrupt, wrong-type, and unavailable storage", () => {
  for (const storage of [
    storageWith("{not json"),
    storageWith(JSON.stringify(["not settings"])),
    storageWith(JSON.stringify("not settings")),
    { getItem() { throw new Error("blocked"); } },
    null
  ]) {
    assert.deepEqual(readSettings(storage), {
      settings: { ...DEFAULT_ASSUMPTIONS },
      persisted: null
    });
  }
});

test("readSettings restores valid partial legacy data without treating fallbacks as persisted", () => {
  const storage = storageWith(JSON.stringify({
    vehicleType: "ev",
    electricityPrice: 0.31,
    maintenance: -1,
    unknown: "do not keep"
  }));

  const restored = readSettings(storage);
  assert.deepEqual(restored.settings, {
    ...DEFAULT_ASSUMPTIONS,
    vehicleType: "ev",
    electricityPrice: 0.31
  });
  assert.deepEqual(restored.persisted, {
    vehicleType: "ev",
    electricityPrice: 0.31
  });
});

test("writeSettings keeps the complete legacy shape, allowlists fields, and rejects invalid snapshots", () => {
  const storage = storageWith(null);
  const snapshot = { ...DEFAULT_ASSUMPTIONS, fuelPrice: 4.25, note: "do not store" };

  assert.equal(writeSettings(storage, snapshot), true);
  assert.deepEqual(JSON.parse(storage.value()), {
    ...DEFAULT_ASSUMPTIONS,
    fuelPrice: 4.25
  });

  assert.equal(writeSettings(storage, { ...snapshot, mpg: 0 }), false);
  assert.equal(writeSettings(storage, { vehicleType: "gas", mpg: 25 }), false);
  assert.equal(writeSettings({ setItem() { throw new Error("blocked"); } }, snapshot), false);
});

test("assumptionState distinguishes starter, saved, and a real unsaved vehicle edit", () => {
  const savedGas = { ...DEFAULT_ASSUMPTIONS, fuelPrice: 4.25, targetHourlyProfit: 40 };

  assert.equal(assumptionState(DEFAULT_ASSUMPTIONS, null), "starter");
  assert.equal(assumptionState({ ...DEFAULT_ASSUMPTIONS, vehicleType: "ev" }, null), "starter");
  assert.equal(assumptionState(savedGas, savedGas), "saved");
  assert.equal(assumptionState(DEFAULT_ASSUMPTIONS, savedGas), "unsaved");
  assert.equal(assumptionState(DEFAULT_ASSUMPTIONS, DEFAULT_ASSUMPTIONS), "starter");
  assert.equal(
    assumptionState({ ...savedGas, fuelPrice: 4.5 }, savedGas),
    "unsaved"
  );
});

test("assumptionState ignores target changes and requires every selected-vehicle value to be persisted", () => {
  const savedGas = { ...DEFAULT_ASSUMPTIONS, fuelPrice: 4.25 };

  assert.equal(
    assumptionState({ ...savedGas, targetHourlyProfit: 80 }, savedGas),
    "saved"
  );
  assert.equal(
    assumptionState({ ...DEFAULT_ASSUMPTIONS, fuelPrice: 4.25 }, { fuelPrice: 4.25 }),
    "unsaved"
  );
});
