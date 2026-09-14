import { RecruiterShortlistDetailPage } from "@/components/kindred/pages/RecruiterShortlistDetailPage";

export default async function RecruiterShortlistDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecruiterShortlistDetailPage shortlistId={Number(id)} />;
}
