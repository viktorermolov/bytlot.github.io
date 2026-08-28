import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateCostPerMile,
  calculateOfferProfit,
  calculateShiftProfit
} from "../js/calculations.js";

const gas = (overrides = {}) => ({
  type: "gas",
  efficiency: 25,
  energyPrice: 4,
  chargingLossPercent: 0,
  maintenance: 0.1,
  tires: 0.02,
  depreciation: 0.15,
  other: 0.03,
  ...overrides
});

const ev = (overrides = {}) => ({
  type: "ev",
  efficiency: 3,
  efficiencyUnit: "miPerKwh",
  energyPrice: 0.15,
  chargingLossPercent: 10,
  maintenance: 0.08,
  tires: 0.03,
  depreciation: 0.08,
  other: 0.01,
  ...overrides
});

function close(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);
}

test("gas shift includes pay components and every vehicle-cost category", () => {
  const result = calculateShiftProfit({
    basePay: 100,
    tips: 20,
    bonuses: 5,
    hours: 5,
    miles: 100,
    vehicle: gas()
  });

  close(result.grossEarnings, 125);
  close(result.totalCostPerMile, 0.46);
  close(result.totalVehicleCost, 46);
  close(result.estimatedProfit, 79);
  close(result.grossPerHour, 25);
  close(result.profitPerHour, 15.8);
  close(result.profitPerMile, 0.79);
  close(result.vehicleCostPercentOfGross, 36.8);
});

test("EV shift accounts for wall-to-battery charging loss", () => {
  const result = calculateShiftProfit({
    basePay: 90,
    tips: 0,
    bonuses: 10,
    hours: 4,
    miles: 120,
    vehicle: ev()
  });

  close(result.energyCostPerMile, 0.05555555555555555);
  close(result.totalCostPerMile, 0.25555555555555554);
  close(result.totalVehicleCost, 30.666666666666664);
  close(result.estimatedProfit, 69.33333333333334);
  close(result.profitPerHour, 17.333333333333336);
  close(result.profitPerMile, 0.5777777777777778);
  close(result.vehicleCostPercentOfGross, 30.666666666666664);
});

test("offer includes deadhead miles and target payout", () => {
  const result = calculateOfferProfit({
    offeredPayout: 18,
    estimatedMinutes: 40,
    workMiles: 40,
    deadheadMiles: 10,
    targetHourlyProfit: 22,
    vehicle: gas()
  });

  close(result.totalMiles, 50);
  close(result.totalVehicleCost, 23);
  close(result.estimatedProfit, -5);
  close(result.profitPerHour, -7.5);
  close(result.minimumRequiredPayout, 37.67);
  close(result.offerDifference, -19.67);
  assert.equal(result.meetsTarget, false);
});

test("EV offer can fall just below target", () => {
  const result = calculateOfferProfit({
    offeredPayout: 30,
    estimatedMinutes: 60,
    workMiles: 20,
    deadheadMiles: 5,
    targetHourlyProfit: 25,
    vehicle: ev({
      efficiency: 4,
      energyPrice: 0.2,
      chargingLossPercent: 20,
      maintenance: 0.05,
      tires: 0.03,
      depreciation: 0.05,
      other: 0.02
    })
  });

  close(result.totalCostPerMile, 0.2125);
  close(result.totalVehicleCost, 5.3125);
  close(result.estimatedProfit, 24.6875);
  close(result.profitPerHour, 24.6875);
  close(result.profitPerMile, 0.9875);
  close(result.minimumRequiredPayout, 30.32);
  close(result.offerDifference, -0.32);
  assert.equal(result.meetsTarget, false);
});

test("zero-mile shift keeps hourly outputs and makes profit per mile unavailable", () => {
  const result = calculateShiftProfit({
    basePay: 50,
    tips: 0,
    bonuses: 0,
    hours: 2,
    miles: 0,
    vehicle: gas()
  });
  close(result.totalVehicleCost, 0);
  close(result.estimatedProfit, 50);
  close(result.profitPerHour, 25);
  assert.equal(result.profitPerMile, null);
  close(result.vehicleCostPercentOfGross, 0);
});

test("zero gross permits a negative result and makes cost share unavailable", () => {
  const result = calculateShiftProfit({
    basePay: 0,
    tips: 0,
    bonuses: 0,
    hours: 1,
    miles: 10,
    vehicle: gas({ energyPrice: 2.5, maintenance: 0.1, tires: 0.05, depreciation: 0.1, other: 0.05 })
  });
  close(result.totalCostPerMile, 0.4);
  close(result.estimatedProfit, -4);
  assert.equal(result.vehicleCostPercentOfGross, null);
});

test("MPG must be greater than zero", () => {
  assert.throws(() => calculateCostPerMile(gas({ efficiency: 0 })), /greater than zero/);
});

test("charging loss must stay below 100 percent", () => {
  assert.throws(() => calculateCostPerMile(ev({ chargingLossPercent: 100 })), /less than 100%/);
});

test("deadhead-only offer can exactly meet target", () => {
  const result = calculateOfferProfit({
    offeredPayout: 15,
    estimatedMinutes: 30,
    workMiles: 0,
    deadheadMiles: 10,
    targetHourlyProfit: 20,
    vehicle: gas({ efficiency: 10, energyPrice: 2, maintenance: 0.1, tires: 0.05, depreciation: 0.1, other: 0.05 })
  });
  close(result.totalCostPerMile, 0.5);
  close(result.estimatedProfit, 10);
  close(result.profitPerHour, 20);
  close(result.minimumRequiredPayout, 15);
  assert.equal(result.meetsTarget, true);
});

test("zero-mile offer has no per-mile profit", () => {
  const result = calculateOfferProfit({
    offeredPayout: 30,
    estimatedMinutes: 59,
    workMiles: 0,
    deadheadMiles: 0,
    targetHourlyProfit: 30,
    vehicle: gas({ energyPrice: 0, maintenance: 0, tires: 0, depreciation: 0, other: 0 })
  });
  close(result.profitPerHour, 30.508474576271183);
  assert.equal(result.profitPerMile, null);
  close(result.minimumRequiredPayout, 29.5);
});

test("cent ceiling is applied through the complete offer calculation", () => {
  const result = calculateOfferProfit({
    offeredPayout: 0.33,
    estimatedMinutes: 1,
    workMiles: 1,
    deadheadMiles: 0,
    targetHourlyProfit: 20,
    vehicle: gas({
      efficiency: 1,
      energyPrice: 0,
      maintenance: 0.001,
      tires: 0,
      depreciation: 0,
      other: 0
    })
  });
  close(result.rawRequiredPayout, 0.3343333333333333);
  close(result.minimumRequiredPayout, 0.34);
  close(result.offerDifference, -0.01);
  assert.equal(result.meetsTarget, false);
});

test("exact-cent minimum payouts remain on the same cent", () => {
  for (const target of [0.07, 0.14, 0.55]) {
    const result = calculateOfferProfit({
      offeredPayout: target,
      estimatedMinutes: 60,
      workMiles: 0,
      deadheadMiles: 0,
      targetHourlyProfit: target,
      vehicle: gas({
        energyPrice: 0,
        maintenance: 0,
        tires: 0,
        depreciation: 0,
        other: 0
      })
    });
    close(result.minimumRequiredPayout, target);
    assert.equal(result.meetsTarget, true);
  }
});

test("fractional gas inputs retain full internal precision", () => {
  const result = calculateShiftProfit({
    basePay: 200,
    tips: 0,
    bonuses: 0,
    hours: 4,
    miles: 100,
    vehicle: gas({ efficiency: 33, energyPrice: 3.599, maintenance: 0.1, tires: 0.035, depreciation: 0.18, other: 0.02 })
  });
  close(result.totalCostPerMile, 0.4440606060606061);
  close(result.totalVehicleCost, 44.40606060606061);
  close(result.estimatedProfit, 155.5939393939394);
  close(result.profitPerHour, 38.89848484848485);
  close(result.profitPerMile, 1.555939393939394);
  close(result.vehicleCostPercentOfGross, 22.203030303030303);
});

test("EV kWh per 100 miles is normalized before calculating cost", () => {
  const result = calculateShiftProfit({
    basePay: 120,
    tips: 0,
    bonuses: 0,
    hours: 3,
    miles: 100,
    vehicle: ev({
      efficiency: 25,
      efficiencyUnit: "kwhPer100Mi",
      energyPrice: 0.2,
      chargingLossPercent: 0,
      maintenance: 0.1,
      tires: 0.03,
      depreciation: 0.1,
      other: 0.02
    })
  });
  close(result.energyCostPerMile, 0.05);
  close(result.totalCostPerMile, 0.3);
  close(result.totalVehicleCost, 30);
  close(result.estimatedProfit, 90);
  close(result.profitPerHour, 30);
  close(result.profitPerMile, 0.9);
  close(result.vehicleCostPercentOfGross, 25);
});

test("base pay, tips, and bonuses are added once", () => {
  const result = calculateShiftProfit({
    basePay: 80,
    tips: 15,
    bonuses: 5,
    hours: 2,
    miles: 50,
    vehicle: gas({ efficiency: 50, energyPrice: 3, maintenance: 0.02, tires: 0.02, depreciation: 0.04, other: 0.02 })
  });
  close(result.grossEarnings, 100);
  close(result.totalCostPerMile, 0.16);
  close(result.estimatedProfit, 92);
});

test("zero estimated minutes is rejected", () => {
  assert.throws(() => calculateOfferProfit({
    offeredPayout: 20,
    estimatedMinutes: 0,
    workMiles: 1,
    deadheadMiles: 0,
    targetHourlyProfit: 20,
    vehicle: gas()
  }), /greater than zero/);
});

test("negative and non-finite inputs are rejected", () => {
  assert.throws(() => calculateShiftProfit({
    basePay: -1,
    tips: 0,
    bonuses: 0,
    hours: 1,
    miles: 1,
    vehicle: gas()
  }), /cannot be negative/);
  assert.throws(() => calculateCostPerMile(gas({ energyPrice: Number.NaN })), /finite number/);
  assert.throws(() => calculateShiftProfit(null), /must be an object/);
  assert.throws(() => calculateOfferProfit(undefined), /must be an object/);
  assert.throws(() => calculateCostPerMile(ev({ efficiencyUnit: "wattsPerMile" })), /efficiency unit/);
});
