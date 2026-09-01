import { CompanyDetailPage } from "@/components/kindred/pages/CompanyDetailPage";

export default async function CompanyDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <CompanyDetailPage slug={slug} />;
}
