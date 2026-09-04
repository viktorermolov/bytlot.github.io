import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_ASSUMPTIONS, calculateCostPerMile, calculateOfferProfit, calculateShiftProfit } from "../js/calculations.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const vehicle = {
  type: "gas",
  efficiency: DEFAULT_ASSUMPTIONS.mpg,
  energyPrice: DEFAULT_ASSUMPTIONS.fuelPrice,
  maintenance: DEFAULT_ASSUMPTIONS.maintenance,
  tires: DEFAULT_ASSUMPTIONS.tires,
  depreciation: DEFAULT_ASSUMPTIONS.depreciation,
  other: DEFAULT_ASSUMPTIONS.other
};
const dollars = (value) => `$${value.toFixed(2)}`;

test("crawlable worked examples stay consistent with their published inputs and starter cost basis", () => {
  assert.deepEqual(vehicle, { type: "gas", efficiency: 25, energyPrice: 3.5, maintenance: 0.1, tires: 0.03, depreciation: 0.15, other: 0.02 });
  assert.equal(dollars(calculateCostPerMile(vehicle).totalCostPerMile), "$0.44");
  assert.ok(html.includes("25 MPG, $3.50/gal, plus $0.10 maintenance, $0.03 tires, $0.15 depreciation and $0.02 other per mile"));

  const shift = html.match(/<article id="example-shift"[\s\S]*?<\/article>/)?.[0];
  assert.ok(shift?.includes("$100 base payout + $20 tips + $0 bonuses, over 5 hours and 80 total miles."));
  const shiftResult = calculateShiftProfit({ basePay: 100, tips: 20, bonuses: 0, hours: 5, miles: 80, vehicle });
  for (const value of [shiftResult.totalVehicleCost, shiftResult.estimatedProfit, shiftResult.profitPerHour]) {
    assert.ok(shift.includes(`<dd>${dollars(value)}`));
  }

  const offer = html.match(/<article id="example-offer"[\s\S]*?<\/article>/)?.[0];
  assert.ok(offer?.includes("45 minutes including waiting and return time, 18 work miles + 4 extra return miles, and a $22/hr profit target."));
  const offerResult = calculateOfferProfit({ offeredPayout: 24, estimatedMinutes: 45, workMiles: 18, deadheadMiles: 4, targetHourlyProfit: 22, vehicle });
  for (const value of [offerResult.totalVehicleCost, offerResult.estimatedProfit, offerResult.profitPerHour, offerResult.minimumRequiredPayout]) {
    assert.ok(offer.includes(`<dd>${dollars(value)}`));
  }
  assert.equal(offerResult.meetsTarget, false);
  assert.ok(offer.includes(`This offer is ${dollars(Math.abs(offerResult.offerDifference))} below`));
});
