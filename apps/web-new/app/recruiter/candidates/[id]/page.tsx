import { RecruiterCandidateProfilePage } from "@/components/kindred/pages/RecruiterCandidateProfilePage";

export default async function RecruiterCandidateProfileRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RecruiterCandidateProfilePage candidateId={id} />;
}
