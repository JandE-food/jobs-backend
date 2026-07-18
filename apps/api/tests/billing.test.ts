import assert from "node:assert/strict";
import test from "node:test";

import {
  getBillingProvider,
  getPlanConfig,
  isBillingPlan,
} from "../src/lib/billing.ts";

test("uses Stripe for UK and EU style countries", () => {
  assert.equal(getBillingProvider("UK"), "stripe");
  assert.equal(getBillingProvider("Germany"), "stripe");
});

test("uses Paystack for African countries", () => {
  assert.equal(getBillingProvider("Nigeria"), "paystack");
  assert.equal(getBillingProvider("KE"), "paystack");
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
