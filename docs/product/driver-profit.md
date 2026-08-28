# Driver Profit

## User problem

Gig-work payouts and gross hourly earnings omit the operating cost of the vehicle. Driver Profit estimates the number that matters: profit after estimated vehicle cost.

## Audience and positioning

For delivery drivers and gig workers generally, including workers who may use any delivery, rideshare, or service platform. The product is platform-neutral; platform-specific presets, rules, or claims are out of scope for the core engine.

## MVP workflows

### What did I really earn?

Use base platform payout, tips, bonuses, hours, miles, and vehicle assumptions. Gross earnings are `base payout + tips + bonuses`; keeping the inputs separate prevents double-counting. Show gross hourly earnings, estimated vehicle cost, estimated real profit, real profit per hour, real profit per mile, cost per mile, and the share of gross consumed by vehicle cost.

### Should I take this offer?

Use offered payout, estimated time, estimated miles, optional return/deadhead miles, vehicle assumptions, and target hourly profit. Show estimated vehicle cost, real profit, real hourly profit, profit per mile, minimum payout for the target, and the difference from that minimum.

## Calculation and wording rules

Vehicle cost may include energy, maintenance, tires, depreciation, and other user-configurable expenses. Gas and EV assumptions require separate inputs. Do not imply a universal good-offer threshold; calculate from the user’s assumptions. Do not present an IRS mileage rate as estimated actual vehicle cost. Avoid false precision and present results as estimates.

### Formula reference

- Gas energy cost per mile: `fuel price / MPG`.
- EV energy cost per mile, mi/kWh: `electricity price / (mi/kWh × (1 − charging loss))`.
- EV energy cost per mile, kWh/100 mi: `electricity price × kWh/100 mi / (100 × (1 − charging loss))`.
- Vehicle cost per mile: energy plus maintenance, tires, depreciation, and other per-mile assumptions.
- Shift estimated profit: gross earnings minus `miles × vehicle cost per mile`.
- Offer minimum payout: `vehicle cost + target hourly profit × estimated hours`, always rounded up to the next cent.

Keep full precision inside the engine and round only displayed currency/rates. Zero miles makes profit/mile unavailable; zero gross makes the vehicle-cost percentage unavailable. Offer time must include time associated with any return/deadhead miles.

### Starter assumptions

The UI uses round, editable starter values to reduce first-use friction: gas at 25 MPG and $3.50/gal; EV at 3.5 mi/kWh, $0.18/kWh, and 10% charging loss; plus $0.10 maintenance, $0.03 tires, $0.15 depreciation, and $0.02 other per mile. These are product defaults, not measured local prices, personalized estimates, tax rates, or claims about a typical driver. The interface labels them as starters and lets the user replace or zero every category.

## Non-goals

Accounts, platform integrations, tax advice, trip tracking, payout guarantees, and server-side history are not MVP scope.
