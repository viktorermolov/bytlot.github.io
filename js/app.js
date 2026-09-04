import {
  DEFAULT_ASSUMPTIONS,
  calculateCostPerMile,
  calculateOfferProfit,
  calculateShiftProfit
} from "./calculations.js?v=20260831-perf";
import { readSettings, writeSettings, assumptionState } from "./settings.js?v=20260904-clarity";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const estimatedCostFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 3
});
const decimalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2
});

const tabs = [...document.querySelectorAll("[data-mode]")];
const panels = [...document.querySelectorAll("[data-panel]")];
const assumptionsDetails = document.querySelector("#vehicle-assumptions");
const assumptionsSummary = document.querySelector("#assumptions-summary");
const assumptionsState = document.querySelector("#assumptions-state");
const assumptionsHelp = document.querySelector("#assumptions-help");
const gasFields = document.querySelector("#gas-fields");
const evFields = document.querySelector("#ev-fields");
const resultsPanel = document.querySelector("#results");
const resultsTitle = document.querySelector("#results-title");
const primaryResult = document.querySelector("#primary-result");
const resultSupport = document.querySelector("#result-support");
const resultList = document.querySelector("#result-list");
const breakdown = document.querySelector("#breakdown");
const offerVerdict = document.querySelector("#offer-verdict");

let activeMode = "shift";
let hasResult = false;
let persistedSettings = null;
let settingsWriteFailed = false;

function inputNumber(id) {
  const value = document.querySelector(`#${id}`).value.trim();
  return value === "" ? Number.NaN : Number(value);
}

function selectedVehicleType() {
  return document.querySelector("input[name='vehicle-type']:checked").value;
}

function vehicleFromInputs() {
  const type = selectedVehicleType();
  return {
    type,
    efficiency: type === "gas" ? inputNumber("mpg") : inputNumber("ev-efficiency"),
    efficiencyUnit: type === "ev"
      ? document.querySelector("#ev-efficiency-unit").value
      : null,
    energyPrice: type === "gas" ? inputNumber("fuel-price") : inputNumber("electricity-price"),
    chargingLossPercent: type === "ev" ? inputNumber("charging-loss") : 0,
    maintenance: inputNumber("maintenance"),
    tires: inputNumber("tires"),
    depreciation: inputNumber("depreciation"),
    other: inputNumber("other-cost")
  };
}

function currency(value) {
  return currencyFormatter.format(value);
}

function signedCurrency(value) {
  if (Math.abs(value) < 0.005) return currency(0);
  return `${value > 0 ? "+" : "−"}${currency(Math.abs(value))}`;
}

function estimatedCost(value) {
  return estimatedCostFormatter.format(value);
}

function perMile(value) {
  return value === null ? "N/A" : `${estimatedCost(value)}/mi`;
}

function percentage(value) {
  return value === null ? "N/A" : `${decimalFormatter.format(value)}%`;
}

function settingsSnapshot() {
  return {
    vehicleType: selectedVehicleType(),
    mpg: inputNumber("mpg"),
    fuelPrice: inputNumber("fuel-price"),
    evEfficiency: inputNumber("ev-efficiency"),
    evEfficiencyUnit: document.querySelector("#ev-efficiency-unit").value,
    electricityPrice: inputNumber("electricity-price"),
    chargingLossPercent: inputNumber("charging-loss"),
    maintenance: inputNumber("maintenance"),
    tires: inputNumber("tires"),
    depreciation: inputNumber("depreciation"),
    other: inputNumber("other-cost"),
    targetHourlyProfit: inputNumber("target-hourly")
  };
}

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function saveSettings() {
  const snapshot = settingsSnapshot();
  settingsWriteFailed = !writeSettings(browserStorage(), snapshot);
  if (!settingsWriteFailed) persistedSettings = snapshot;
  updateAssumptionsSummary();
}

function setInputValue(id, value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    document.querySelector(`#${id}`).value = String(value);
  }
}

function restoreSettings() {
  const { settings: values, persisted } = readSettings(browserStorage());
  persistedSettings = persisted;
  const type = values.vehicleType === "ev" ? "ev" : "gas";
  document.querySelector(`input[name='vehicle-type'][value='${type}']`).checked = true;
  setInputValue("mpg", values.mpg);
  setInputValue("fuel-price", values.fuelPrice);
  setInputValue("ev-efficiency", values.evEfficiency);
  document.querySelector("#ev-efficiency-unit").value = values.evEfficiencyUnit === "kwhPer100Mi"
    ? "kwhPer100Mi"
    : "miPerKwh";
  setInputValue("electricity-price", values.electricityPrice);
  setInputValue("charging-loss", values.chargingLossPercent);
  setInputValue("maintenance", values.maintenance);
  setInputValue("tires", values.tires);
  setInputValue("depreciation", values.depreciation);
  setInputValue("other-cost", values.other);
  setInputValue("target-hourly", values.targetHourlyProfit);
}

function updateVehicleFields() {
  const isGas = selectedVehicleType() === "gas";
  gasFields.hidden = !isGas;
  evFields.hidden = isGas;
}

function updateAssumptionsSummary() {
  const state = assumptionState(settingsSnapshot(), persistedSettings);
  assumptionsState.textContent = {
    starter: "Starter assumptions",
    saved: "Saved on this device",
    unsaved: "Unsaved vehicle edits"
  }[state];
  assumptionsHelp.textContent = {
    starter: "Starter estimates are editable—not current local prices or tax rates.",
    saved: "These vehicle assumptions are saved in this browser. Reset restores the starter values and hourly target.",
    unsaved: settingsWriteFailed
      ? "These vehicle edits could not be saved. They stay in this page."
      : "Your vehicle edits have not been saved yet."
  }[state];
  try {
    const vehicle = vehicleFromInputs();
    const rates = calculateCostPerMile(vehicle);
    assumptionsSummary.textContent = `${vehicle.type === "gas" ? "Gas" : "EV"} · ${estimatedCost(rates.totalCostPerMile)}/mi estimated`;
  } catch {
    assumptionsSummary.textContent = "Adjust vehicle costs to complete the estimate";
  }
}

function clearResults() {
  hasResult = false;
  offerVerdict.hidden = true;
  resultsPanel.classList.remove("is-negative", "is-stale");
  resultsTitle.textContent = activeMode === "shift"
    ? "Estimated real profit"
    : "Expected real profit / hour";
  primaryResult.textContent = "—";
  primaryResult.setAttribute("aria-label", "No result yet");
  resultSupport.textContent = activeMode === "shift"
    ? "Enter your shift details to see what remains after estimated vehicle costs."
    : "Enter the offer details to compare it with your own hourly target.";
  setMetrics(activeMode === "shift" ? [
    ["Real profit / hour", "—"],
    ["Gross earnings", "—"],
    ["Vehicle cost", "—"],
    ["Cost / mile", "—"]
  ] : [
    ["Expected real profit", "—"],
    ["Minimum payout for target", "—"],
    ["Vehicle cost", "—"],
    ["Cost / mile", "—"]
  ]);
  breakdown.hidden = true;
  breakdown.open = false;
}

function setMode(mode, focusTab = false) {
  activeMode = mode;
  tabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focusTab) tab.focus();
  });
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== mode;
  });
  clearResults();
}

function setMetrics(metrics) {
  const rows = metrics.map(([label, value]) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    return row;
  });
  resultList.textContent = "";
  resultList.append(...rows);
}

function setBreakdown(result) {
  document.querySelector("#breakdown-energy").textContent = estimatedCost(result.energyCost);
  document.querySelector("#breakdown-other").textContent = estimatedCost(result.nonEnergyCost);
  document.querySelector("#breakdown-total").textContent = estimatedCost(result.totalVehicleCost);
  breakdown.hidden = false;
}

function completeResult(result) {
  hasResult = true;
  resultsPanel.classList.remove("is-stale");
  resultsPanel.classList.toggle("is-negative", result.estimatedProfit < 0);
  primaryResult.removeAttribute("aria-label");
  setBreakdown(result);

  if (matchMedia("(max-width: 800px)").matches) {
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
}

function renderShift(result) {
  offerVerdict.hidden = true;
  resultsTitle.textContent = "Estimated real profit";
  primaryResult.textContent = currency(result.estimatedProfit);

  if (result.estimatedProfit < 0) {
    resultSupport.textContent = `Estimated vehicle costs exceeded gross earnings by ${currency(Math.abs(result.estimatedProfit))}.`;
  } else {
    resultSupport.textContent = `${estimatedCost(result.totalVehicleCost)} in estimated vehicle costs leaves ${currency(result.estimatedProfit)} before taxes.`;
  }

  setMetrics([
    ["Real profit / hour", `${currency(result.profitPerHour)}/hr`],
    ["Gross earnings", currency(result.grossEarnings)],
    ["Gross earnings / hour", `${currency(result.grossPerHour)}/hr`],
    ["Vehicle cost", estimatedCost(result.totalVehicleCost)],
    ["Cost / mile", perMile(result.totalCostPerMile)],
    ["Real profit / mile", perMile(result.profitPerMile)],
    ["Vehicle cost share of gross", percentage(result.vehicleCostPercentOfGross)]
  ]);
  completeResult(result);
}

function renderOffer(result, targetHourlyProfit) {
  offerVerdict.textContent = result.meetsTarget ? "Meets your target" : "Below your target";
  offerVerdict.classList.toggle("is-met", result.meetsTarget);
  offerVerdict.hidden = false;
  resultsTitle.textContent = "Expected real profit / hour";
  primaryResult.textContent = `${currency(result.profitPerHour)}/hr`;
  const difference = Math.abs(result.offerDifference);

  if (result.meetsTarget) {
    resultSupport.textContent = `Meets your ${currency(targetHourlyProfit)}/hr target by ${currency(difference)} in total payout.`;
  } else {
    resultSupport.textContent = `Falls ${currency(difference)} short of the payout needed for your ${currency(targetHourlyProfit)}/hr target.`;
  }

  setMetrics([
    ["Expected real profit", currency(result.estimatedProfit)],
    ["Minimum payout for target", currency(result.minimumRequiredPayout)],
    ["Offer vs. required payout", signedCurrency(result.offerDifference)],
    ["Total miles", `${decimalFormatter.format(result.totalMiles)} mi`],
    ["Vehicle cost", estimatedCost(result.totalVehicleCost)],
    ["Cost / mile", perMile(result.totalCostPerMile)],
    ["Real profit / mile", perMile(result.profitPerMile)]
  ]);
  completeResult(result);
}

function markResultsStale() {
  if (!hasResult) return;
  offerVerdict.hidden = true;
  resultsPanel.classList.add("is-stale");
  resultSupport.textContent = "Inputs changed. Recalculate to refresh this estimate.";
}

function assumptionInputsForCurrentVehicle() {
  const ids = ["maintenance", "tires", "depreciation", "other-cost"];
  ids.push(...(selectedVehicleType() === "gas"
    ? ["mpg", "fuel-price"]
    : ["ev-efficiency", "electricity-price", "charging-loss"]));
  return ids.map((id) => document.querySelector(`#${id}`));
}

function validateAssumptions() {
  const invalid = assumptionInputsForCurrentVehicle().find((input) => !input.checkValidity());
  if (invalid) {
    assumptionsDetails.open = true;
    invalid.reportValidity();
    invalid.focus();
    return false;
  }
  return true;
}

function showFormError(id, error) {
  const element = document.querySelector(`#${id}`);
  element.textContent = error instanceof Error ? error.message : "Check the values and try again.";
  element.hidden = false;
}

document.querySelector("#shift-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const error = document.querySelector("#shift-error");
  error.hidden = true;
  if (!validateAssumptions()) return;

  try {
    const result = calculateShiftProfit({
      basePay: inputNumber("base-pay"),
      tips: inputNumber("tips"),
      bonuses: inputNumber("bonuses"),
      hours: inputNumber("hours-worked"),
      miles: inputNumber("miles-driven"),
      vehicle: vehicleFromInputs()
    });
    saveSettings();
    renderShift(result);
  } catch (calculationError) {
    showFormError("shift-error", calculationError);
  }
});

document.querySelector("#offer-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const error = document.querySelector("#offer-error");
  error.hidden = true;
  if (!validateAssumptions()) return;

  try {
    const targetHourlyProfit = inputNumber("target-hourly");
    const result = calculateOfferProfit({
      offeredPayout: inputNumber("offer-payout"),
      estimatedMinutes: inputNumber("offer-minutes"),
      workMiles: inputNumber("offer-miles"),
      deadheadMiles: inputNumber("deadhead-miles"),
      targetHourlyProfit,
      vehicle: vehicleFromInputs()
    });
    saveSettings();
    renderOffer(result, targetHourlyProfit);
  } catch (calculationError) {
    showFormError("offer-error", calculationError);
  }
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") return setMode(tabs[0].dataset.mode, true);
    if (event.key === "End") return setMode(tabs[tabs.length - 1].dataset.mode, true);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (tabs.indexOf(tab) + direction + tabs.length) % tabs.length;
    setMode(tabs[nextIndex].dataset.mode, true);
  });
});

document.querySelectorAll("[data-start-mode]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const mode = link.dataset.startMode;
    if (activeMode !== mode) setMode(mode);
    document.querySelector(".input-panel").scrollIntoView({ block: "start" });
    document.querySelector(mode === "shift" ? "#base-pay" : "#offer-payout").focus({ preventScroll: true });
  });
});

document.querySelectorAll("input[name='vehicle-type']").forEach((input) => {
  input.addEventListener("change", () => {
    updateVehicleFields();
    updateAssumptionsSummary();
    saveSettings();
    markResultsStale();
  });
});

document.querySelectorAll("#vehicle-assumptions input, #vehicle-assumptions select").forEach((input) => {
  input.addEventListener("input", () => {
    settingsWriteFailed = false;
    updateAssumptionsSummary();
    markResultsStale();
  });
  input.addEventListener("change", saveSettings);
});

document.querySelectorAll("#shift-form input, #offer-form input").forEach((input) => {
  input.addEventListener("input", markResultsStale);
});

document.querySelector("#target-hourly").addEventListener("change", saveSettings);

document.querySelector("#reset-assumptions").addEventListener("click", () => {
  const defaults = DEFAULT_ASSUMPTIONS;
  document.querySelector("input[name='vehicle-type'][value='gas']").checked = true;
  setInputValue("mpg", defaults.mpg);
  setInputValue("fuel-price", defaults.fuelPrice);
  setInputValue("ev-efficiency", defaults.evEfficiency);
  document.querySelector("#ev-efficiency-unit").value = defaults.evEfficiencyUnit;
  setInputValue("electricity-price", defaults.electricityPrice);
  setInputValue("charging-loss", defaults.chargingLossPercent);
  setInputValue("maintenance", defaults.maintenance);
  setInputValue("tires", defaults.tires);
  setInputValue("depreciation", defaults.depreciation);
  setInputValue("other-cost", defaults.other);
  setInputValue("target-hourly", defaults.targetHourlyProfit);
  updateVehicleFields();
  updateAssumptionsSummary();
  saveSettings();
  markResultsStale();
});

const feedbackTrigger = document.querySelector("#feedback-open");
const feedbackLoadError = document.querySelector("#feedback-load-error");
let feedbackControllerPromise;

feedbackTrigger.addEventListener("click", async () => {
  feedbackLoadError.hidden = true;
  feedbackTrigger.disabled = true;
  feedbackTrigger.setAttribute("aria-busy", "true");

  try {
    feedbackControllerPromise ||= import("./feedback.js?v=20260831-feedback")
      .then(({ createFeedbackController }) => createFeedbackController());
    const controller = await feedbackControllerPromise;
    controller.open(feedbackTrigger);
  } catch {
    feedbackControllerPromise = undefined;
    feedbackLoadError.hidden = false;
  } finally {
    feedbackTrigger.disabled = false;
    feedbackTrigger.removeAttribute("aria-busy");
  }
});

restoreSettings();
updateVehicleFields();
updateAssumptionsSummary();
clearResults();
