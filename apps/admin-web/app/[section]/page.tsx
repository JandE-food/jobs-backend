import { notFound } from "next/navigation";

import { AdminSectionPage } from "@/components/admin-app";

const validSections = new Set([
  "overview",
  "users",
  "moderation",
  "subscriptions",
  "support",
  "content",
  "finance",
  "discovery",
  "settings",
  "audit",
]);

export default async function AdminSectionRoute({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!validSections.has(section)) {
    notFound();
  }

  return (
    <AdminSectionPage
      section={
        section as
          | "overview"
          | "users"
          | "moderation"
          | "subscriptions"
          | "support"
          | "content"
          | "finance"
          | "discovery"
          | "settings"
          | "audit"
      }
    />
  );
}
