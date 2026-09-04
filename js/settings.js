import { DEFAULT_ASSUMPTIONS } from "./calculations.js?v=20260831-perf";

export const SETTINGS_STORAGE_KEY = "bytlot.driverProfit.assumptions.v1";

const MAX_STORED_LENGTH = 2_048;
const COMMON_VEHICLE_KEYS = ["maintenance", "tires", "depreciation", "other"];
const GAS_VEHICLE_KEYS = ["mpg", "fuelPrice"];
const EV_VEHICLE_KEYS = ["evEfficiency", "evEfficiencyUnit", "electricityPrice", "chargingLossPercent"];

const SETTING_RULES = Object.freeze({
  vehicleType: (value) => value === "gas" || value === "ev",
  mpg: (value) => isNumberInRange(value, 0.1),
  fuelPrice: (value) => isNumberInRange(value, 0),
  evEfficiency: (value) => isNumberInRange(value, 0.1),
  evEfficiencyUnit: (value) => value === "miPerKwh" || value === "kwhPer100Mi",
  electricityPrice: (value) => isNumberInRange(value, 0),
  chargingLossPercent: (value) => isNumberInRange(value, 0, 99.9),
  maintenance: (value) => isNumberInRange(value, 0),
  tires: (value) => isNumberInRange(value, 0),
  depreciation: (value) => isNumberInRange(value, 0),
  other: (value) => isNumberInRange(value, 0),
  targetHourlyProfit: (value) => isNumberInRange(value, 0)
});

const SETTING_KEYS = Object.freeze(Object.keys(SETTING_RULES));

function isNumberInRange(value, minimum, maximum = Infinity) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function validPartial(snapshot) {
  if (!isRecord(snapshot)) return null;

  const partial = {};
  try {
    for (const key of SETTING_KEYS) {
      if (hasOwn(snapshot, key) && SETTING_RULES[key](snapshot[key])) {
        partial[key] = snapshot[key];
      }
    }
  } catch {
    return null;
  }
  return partial;
}

function hasEveryValidSetting(snapshot) {
  if (!isRecord(snapshot)) return false;
  try {
    return SETTING_KEYS.every((key) => hasOwn(snapshot, key) && SETTING_RULES[key](snapshot[key]));
  } catch {
    return false;
  }
}

function vehicleKeysFor(snapshot) {
  if (!isRecord(snapshot) || !SETTING_RULES.vehicleType(snapshot.vehicleType)) return null;
  return [
    "vehicleType",
    ...COMMON_VEHICLE_KEYS,
    ...(snapshot.vehicleType === "gas" ? GAS_VEHICLE_KEYS : EV_VEHICLE_KEYS)
  ];
}

function isValidVehicleSnapshot(snapshot, keys) {
  if (!keys) return false;
  try {
    return keys.every((key) => hasOwn(snapshot, key) && SETTING_RULES[key](snapshot[key]));
  } catch {
    return false;
  }
}

/**
 * Restores only recognized, valid values. `persisted` deliberately remains a
 * partial snapshot so callers can distinguish starter fallback values from
 * values that were actually stored on this device.
 */
export function readSettings(storage) {
  let raw;
  try {
    if (!storage || typeof storage.getItem !== "function") {
      return { settings: { ...DEFAULT_ASSUMPTIONS }, persisted: null };
    }
    raw = storage.getItem(SETTINGS_STORAGE_KEY);
  } catch {
    return { settings: { ...DEFAULT_ASSUMPTIONS }, persisted: null };
  }

  if (typeof raw !== "string" || raw.length > MAX_STORED_LENGTH) {
    return { settings: { ...DEFAULT_ASSUMPTIONS }, persisted: null };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { settings: { ...DEFAULT_ASSUMPTIONS }, persisted: null };
  }

  const persisted = validPartial(parsed);
  if (!persisted || Object.keys(persisted).length === 0) {
    return { settings: { ...DEFAULT_ASSUMPTIONS }, persisted: null };
  }

  return {
    settings: { ...DEFAULT_ASSUMPTIONS, ...persisted },
    persisted
  };
}

/**
 * Writes only the legacy settings fields. Unknown fields are not persisted,
 * and an incomplete or invalid form snapshot cannot replace a prior
 * valid saved snapshot.
 */
export function writeSettings(storage, snapshot) {
  if (!hasEveryValidSetting(snapshot) || !storage || typeof storage.setItem !== "function") {
    return false;
  }

  const safeSnapshot = {};
  for (const key of SETTING_KEYS) safeSnapshot[key] = snapshot[key];

  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(safeSnapshot));
    return true;
  } catch {
    return false;
  }
}

/**
 * Target income is intentionally excluded: this describes only the selected
 * vehicle assumptions shown in the assumptions panel.
 */
export function assumptionState(current, saved) {
  const keys = vehicleKeysFor(current);
  if (!isValidVehicleSnapshot(current, keys)) return "unsaved";

  const matchesSaved = isValidVehicleSnapshot(saved, keys) && keys.every((key) => current[key] === saved[key]);
  const usesStarters = keys.every((key) => key === "vehicleType" || current[key] === DEFAULT_ASSUMPTIONS[key]);
  const conflictsWithSaved = saved && keys.some((key) => hasOwn(saved, key) && current[key] !== saved[key]);
  if (usesStarters && (matchesSaved || !conflictsWithSaved)) {
    return "starter";
  }

  if (matchesSaved) {
    return "saved";
  }

  return "unsaved";
}
