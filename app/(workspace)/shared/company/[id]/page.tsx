import CompanySharePopup from '@/components/CompanySharePopup';

export default function SharedCompanyPage({
    params,
}: {
    params: { id: string };
}) {
    return <CompanySharePopup companyId={params.id} />;
}
