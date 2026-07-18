export type BillingPlan = "free" | "growth" | "scale";
export type BillingProvider = "stripe" | "paystack";

type PlanConfig = {
  id: BillingPlan;
  name: string;
  activeJobs: string;
  amountMinor: number;
  intervalDays: number;
  featured: boolean;
};

const planConfigs: Record<BillingPlan, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    activeJobs: "1 active job",
    amountMinor: 0,
    intervalDays: 30,
    featured: false,
  },
  growth: {
    id: "growth",
    name: "Growth",
    activeJobs: "10 active jobs",
    amountMinor: 4900,
    intervalDays: 30,
    featured: false,
  },
  scale: {
    id: "scale",
    name: "Scale",
    activeJobs: "Many jobs + featured",
    amountMinor: 14900,
    intervalDays: 30,
    featured: true,
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

export function getBillingProvider(country: string): BillingProvider {
  const normalized = normalizeCountry(country);
  return africanCountries.has(normalized) ? "paystack" : "stripe";
}

export function isBillingPlan(value: string): value is BillingPlan {
  return value === "free" || value === "growth" || value === "scale";
}

export function getPlanConfig(plan: BillingPlan) {
  return planConfigs[plan];
}

export function getPeriodEnd(plan: BillingPlan) {
  const config = getPlanConfig(plan);
  const periodEnd = new Date();
  periodEnd.setUTCDate(periodEnd.getUTCDate() + config.intervalDays);
  return periodEnd;
}
