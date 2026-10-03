import { type AppUserRole } from "./users.js";

export type BillingPlan =
  | "user_basic"
  | "company_basic"
  | "user_premium"
  | "company_premium";
export type BillingProvider = "stripe" | "paystack" | "flutterwave";

type PlanConfig = {
  id: BillingPlan;
  name: string;
  audience: "talent" | "company";
  tier: "basic" | "premium";
  monthlyEndorsements: number;
  amountMinor: number;
  intervalDays: number;
  checkoutDescription: string;
};

const planConfigs: Record<BillingPlan, PlanConfig> = {
  user_basic: {
    id: "user_basic",
    name: "Users",
    audience: "talent",
    tier: "basic",
    monthlyEndorsements: 10,
    amountMinor: 300,
    intervalDays: 30,
    checkoutDescription: "10 endorsements each month for talent accounts.",
  },
  company_basic: {
    id: "company_basic",
    name: "Companies",
    audience: "company",
    tier: "basic",
    monthlyEndorsements: 10,
    amountMinor: 300,
    intervalDays: 30,
    checkoutDescription: "10 endorsements each month for company accounts.",
  },
  user_premium: {
    id: "user_premium",
    name: "Premium Users",
    audience: "talent",
    tier: "premium",
    monthlyEndorsements: 200,
    amountMinor: 4000,
    intervalDays: 30,
    checkoutDescription: "200 endorsements each month for premium talent accounts.",
  },
  company_premium: {
    id: "company_premium",
    name: "Premium Companies",
    audience: "company",
    tier: "premium",
    monthlyEndorsements: 200,
    amountMinor: 4000,
    intervalDays: 30,
    checkoutDescription: "200 endorsements each month for premium company accounts.",
  },
};

const africanCountries = new Set([
  "africa",
  "dz",
  "algeria",
  "ao",
  "angola",
  "bj",
  "benin",
  "bw",
  "botswana",
  "cm",
  "cameroon",
  "cv",
  "cape verde",
  "eg",
  "egypt",
  "et",
  "ethiopia",
  "gh",
  "ghana",
  "ke",
  "kenya",
  "ma",
  "morocco",
  "mu",
  "mauritius",
  "na",
  "namibia",
  "ng",
  "nigeria",
  "rw",
  "rwanda",
  "sn",
  "senegal",
  "sl",
  "sierra leone",
  "tz",
  "tanzania",
  "tn",
  "tunisia",
  "ug",
  "uganda",
  "za",
  "south africa",
  "zm",
  "zambia",
  "zw",
  "zimbabwe",
]);

export function normalizeCountry(country: string) {
  return country.trim().toLowerCase();
}

export function isBillingProvider(value: string): value is BillingProvider {
  return (
    value === "stripe" || value === "paystack" || value === "flutterwave"
  );
}

export function getBillingProvider(
  country: string,
  preferredProvider?: BillingProvider,
): BillingProvider {
  if (preferredProvider) {
    return preferredProvider;
  }

  const normalized = normalizeCountry(country);
  return africanCountries.has(normalized) ? "flutterwave" : "stripe";
}

export function isBillingPlan(value: string): value is BillingPlan {
  return (
    value === "user_basic" ||
    value === "company_basic" ||
    value === "user_premium" ||
    value === "company_premium"
  );
}

export function getPlanConfig(plan: BillingPlan) {
  return planConfigs[plan];
}

export function isPremiumPlan(plan: BillingPlan) {
  return getPlanConfig(plan).tier === "premium";
}

export function getMonthlyEndorsementLimit(plan: BillingPlan) {
  return getPlanConfig(plan).monthlyEndorsements;
}

export function getDefaultPlanForRole(role: AppUserRole | "company") {
  return role === "recruiter" || role === "company" ? "company_basic" : "user_basic";
}

export function getPremiumPlanForRole(role: AppUserRole | "company") {
  return role === "recruiter" || role === "company" ? "company_premium" : "user_premium";
}

export function getPeriodEnd(plan: BillingPlan) {
  const config = getPlanConfig(plan);
  const periodEnd = new Date();
  periodEnd.setUTCDate(periodEnd.getUTCDate() + config.intervalDays);
  return periodEnd;
}
