const COST_KEYS = ["maintenance", "tires", "depreciation", "other"];

export const DEFAULT_ASSUMPTIONS = Object.freeze({
  vehicleType: "gas",
  mpg: 25,
  fuelPrice: 3.5,
  evEfficiency: 3.5,
  evEfficiencyUnit: "miPerKwh",
  electricityPrice: 0.18,
  chargingLossPercent: 10,
  maintenance: 0.1,
  tires: 0.03,
  depreciation: 0.15,
  other: 0.02,
  targetHourlyProfit: 22
});

function assertFinite(name, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number.`);
  }
}

function assertNonNegative(name, value) {
  assertFinite(name, value);
  if (value < 0) {
    throw new RangeError(`${name} cannot be negative.`);
  }
}

function assertPositive(name, value) {
  assertFinite(name, value);
  if (value <= 0) {
    throw new RangeError(`${name} must be greater than zero.`);
  }
}

function assertInputObject(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Calculation input must be an object.");
  }
}

function greatestCommonDivisor(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function fraction(numerator, denominator = 1n) {
  if (denominator === 0n) throw new RangeError("Fraction denominator cannot be zero.");
  const sign = denominator < 0n ? -1n : 1n;
  const normalizedNumerator = numerator * sign;
  const normalizedDenominator = denominator * sign;
  const divisor = greatestCommonDivisor(normalizedNumerator, normalizedDenominator) || 1n;
  return {
    numerator: normalizedNumerator / divisor,
    denominator: normalizedDenominator / divisor
  };
}

function numberAsFraction(value) {
  assertFinite("decimal input", value);
  const [coefficient, exponentText = "0"] = value.toString().toLowerCase().split("e");
  const exponent = Number(exponentText);
  const negative = coefficient.startsWith("-");
  const unsigned = negative ? coefficient.slice(1) : coefficient;
  const [whole, decimals = ""] = unsigned.split(".");
  const digits = `${whole}${decimals}`.replace(/^0+(?=\d)/, "") || "0";
  const scale = decimals.length - exponent;
  let numerator = BigInt(digits) * (negative ? -1n : 1n);
  let denominator = 1n;

  if (scale > 0) {
    denominator = 10n ** BigInt(scale);
  } else if (scale < 0) {
    numerator *= 10n ** BigInt(-scale);
  }
  return fraction(numerator, denominator);
}

function addFractions(left, right) {
  return fraction(
    (left.numerator * right.denominator) + (right.numerator * left.denominator),
    left.denominator * right.denominator
  );
}

function subtractFractions(left, right) {
  return fraction(
    (left.numerator * right.denominator) - (right.numerator * left.denominator),
    left.denominator * right.denominator
  );
}

function multiplyFractions(left, right) {
  return fraction(left.numerator * right.numerator, left.denominator * right.denominator);
}

function divideFractions(left, right) {
  return fraction(left.numerator * right.denominator, left.denominator * right.numerator);
}

function fractionToNumber(value) {
  return Number(value.numerator) / Number(value.denominator);
}

function chargingLossFraction(vehicle) {
  if (vehicle.chargingLossPercent !== undefined) {
    assertNonNegative("charging loss percent", vehicle.chargingLossPercent);
    if (vehicle.chargingLossPercent >= 100) {
      throw new RangeError("Charging loss must be less than 100%.");
    }
    return vehicle.chargingLossPercent / 100;
  }

  assertNonNegative("charging loss", vehicle.chargingLoss);
  if (vehicle.chargingLoss >= 1) {
    throw new RangeError("Charging loss must be less than 100%.");
  }
  return vehicle.chargingLoss;
}

function chargingLossAsExactFraction(vehicle) {
  if (vehicle.chargingLossPercent !== undefined) {
    return divideFractions(numberAsFraction(vehicle.chargingLossPercent), fraction(100n));
  }
  return numberAsFraction(vehicle.chargingLoss);
}

function sumPerMileCosts(vehicle) {
  return COST_KEYS.reduce((total, key) => {
    const value = vehicle[key];
    assertNonNegative(key, value);
    return total + value;
  }, 0);
}

export function calculateCostPerMile(vehicle) {
  if (!vehicle || !["gas", "ev"].includes(vehicle.type)) {
    throw new RangeError("Vehicle type must be gas or ev.");
  }

  assertNonNegative("energy price", vehicle.energyPrice);
  let energyCostPerMile;

  if (vehicle.type === "gas") {
    assertPositive("MPG", vehicle.efficiency);
    energyCostPerMile = vehicle.energyPrice / vehicle.efficiency;
  } else {
    assertPositive("EV efficiency", vehicle.efficiency);
    const chargingLoss = chargingLossFraction(vehicle);
    const efficiencyUnit = vehicle.efficiencyUnit || "miPerKwh";
    if (efficiencyUnit === "miPerKwh") {
      energyCostPerMile = vehicle.energyPrice /
        (vehicle.efficiency * (1 - chargingLoss));
    } else if (efficiencyUnit === "kwhPer100Mi") {
      energyCostPerMile = (vehicle.energyPrice * vehicle.efficiency) /
        (100 * (1 - chargingLoss));
    } else {
      throw new RangeError("EV efficiency unit must be miPerKwh or kwhPer100Mi.");
    }
  }

  const nonEnergyCostPerMile = sumPerMileCosts(vehicle);
  return {
    energyCostPerMile,
    nonEnergyCostPerMile,
    totalCostPerMile: energyCostPerMile + nonEnergyCostPerMile
  };
}

export function calculateVehicleCost(miles, vehicle) {
  assertNonNegative("miles", miles);
  const rates = calculateCostPerMile(vehicle);

  return {
    ...rates,
    miles,
    energyCost: miles * rates.energyCostPerMile,
    nonEnergyCost: miles * rates.nonEnergyCostPerMile,
    totalVehicleCost: miles * rates.totalCostPerMile
  };
}

export function calculateShiftProfit(input) {
  assertInputObject(input);
  assertNonNegative("base pay", input.basePay);
  assertNonNegative("tips", input.tips);
  assertNonNegative("bonuses", input.bonuses);
  assertPositive("hours", input.hours);
  assertNonNegative("miles", input.miles);

  const grossEarnings = input.basePay + input.tips + input.bonuses;
  const vehicle = calculateVehicleCost(input.miles, input.vehicle);
  const estimatedProfit = grossEarnings - vehicle.totalVehicleCost;

  return {
    ...vehicle,
    grossEarnings,
    grossPerHour: grossEarnings / input.hours,
    estimatedProfit,
    profitPerHour: estimatedProfit / input.hours,
    profitPerMile: input.miles === 0 ? null : estimatedProfit / input.miles,
    vehicleCostPercentOfGross: grossEarnings === 0
      ? null
      : (vehicle.totalVehicleCost / grossEarnings) * 100
  };
}

function exactRequiredPayout(input, vehicle) {
  const hundred = fraction(100n);
  const one = fraction(1n);
  const totalMiles = addFractions(
    numberAsFraction(input.workMiles),
    numberAsFraction(input.deadheadMiles)
  );
  let energyCostPerMile;

  if (vehicle.type === "gas") {
    energyCostPerMile = divideFractions(
      numberAsFraction(vehicle.energyPrice),
      numberAsFraction(vehicle.efficiency)
    );
  } else {
    const retainedEnergy = subtractFractions(one, chargingLossAsExactFraction(vehicle));
    const efficiency = numberAsFraction(vehicle.efficiency);
    const energyPrice = numberAsFraction(vehicle.energyPrice);
    energyCostPerMile = (vehicle.efficiencyUnit || "miPerKwh") === "kwhPer100Mi"
      ? divideFractions(multiplyFractions(energyPrice, efficiency), multiplyFractions(hundred, retainedEnergy))
      : divideFractions(energyPrice, multiplyFractions(efficiency, retainedEnergy));
  }

  const totalCostPerMile = COST_KEYS.reduce(
    (total, key) => addFractions(total, numberAsFraction(vehicle[key])),
    energyCostPerMile
  );
  const vehicleCost = multiplyFractions(totalMiles, totalCostPerMile);
  const targetProfit = divideFractions(
    multiplyFractions(
      numberAsFraction(input.targetHourlyProfit),
      numberAsFraction(input.estimatedMinutes)
    ),
    fraction(60n)
  );
  const requiredPayout = addFractions(vehicleCost, targetProfit);
  const scaledNumerator = requiredPayout.numerator * 100n;
  const cents = (scaledNumerator + requiredPayout.denominator - 1n) /
    requiredPayout.denominator;

  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError("Calculation values are too large.");
  }

  return {
    raw: fractionToNumber(requiredPayout),
    roundedUp: Number(cents) / 100
  };
}

export function calculateOfferProfit(input) {
  assertInputObject(input);
  assertNonNegative("offered payout", input.offeredPayout);
  assertPositive("estimated minutes", input.estimatedMinutes);
  assertNonNegative("work miles", input.workMiles);
  assertNonNegative("deadhead miles", input.deadheadMiles);
  assertNonNegative("target hourly profit", input.targetHourlyProfit);

  const totalMiles = input.workMiles + input.deadheadMiles;
  const hours = input.estimatedMinutes / 60;
  const vehicle = calculateVehicleCost(totalMiles, input.vehicle);
  const estimatedProfit = input.offeredPayout - vehicle.totalVehicleCost;
  const exactPayout = exactRequiredPayout(input, input.vehicle);
  const rawRequiredPayout = exactPayout.raw;
  const minimumRequiredPayout = exactPayout.roundedUp;

  return {
    ...vehicle,
    totalMiles,
    hours,
    estimatedProfit,
    profitPerHour: estimatedProfit / hours,
    profitPerMile: totalMiles === 0 ? null : estimatedProfit / totalMiles,
    rawRequiredPayout,
    minimumRequiredPayout,
    offerDifference: input.offeredPayout - minimumRequiredPayout,
    meetsTarget: input.offeredPayout >= minimumRequiredPayout
  };
}
