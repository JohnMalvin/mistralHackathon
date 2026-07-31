import SharedPageLoader from '@/components/SharedPageLoader';

export default function SharedPage({ params }: { params: { id: string } }) {
    return <SharedPageLoader dbId={params.id} />;
}
