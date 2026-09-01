import assert from "node:assert/strict";
import test from "node:test";

import {
  getBillingProvider,
  getPlanConfig,
  isBillingProvider,
  isBillingPlan,
} from "../src/lib/billing.js";

test("uses Stripe for UK and EU style countries", () => {
  assert.equal(getBillingProvider("UK"), "stripe");
  assert.equal(getBillingProvider("Germany"), "stripe");
});

test("uses Flutterwave for African countries by default", () => {
  assert.equal(getBillingProvider("Nigeria"), "flutterwave");
  assert.equal(getBillingProvider("KE"), "flutterwave");
});

test("supports explicit provider overrides", () => {
  assert.equal(getBillingProvider("Nigeria", "paystack"), "paystack");
  assert.equal(getBillingProvider("UK", "flutterwave"), "flutterwave");
});

test("recognizes valid plans", () => {
  assert.equal(isBillingPlan("free"), true);
  assert.equal(isBillingPlan("growth"), true);
  assert.equal(isBillingPlan("scale"), true);
  assert.equal(isBillingPlan("enterprise"), false);
});

test("returns plan metadata", () => {
  assert.equal(getPlanConfig("free").activeJobs, "1 active job");
  assert.equal(getPlanConfig("growth").amountMinor, 4900);
});

test("recognizes valid providers", () => {
  assert.equal(isBillingProvider("stripe"), true);
  assert.equal(isBillingProvider("paystack"), true);
  assert.equal(isBillingProvider("flutterwave"), true);
  assert.equal(isBillingProvider("unknown"), false);
});
