import Workspace from "@/components/Workspace";

export default function DocPage({ params }: { params: { id: string } }) {
  return <Workspace pageId={params.id} />;
}
