import { MemberDetailPageClient } from './MemberDetailPageClient';

export default async function MemberDetailPage({
    params,
}: {
    params: Promise<{ id: string }> | { id: string };
}) {
    // Debug logging
    // console.log('params:', params);

    // Handle both Promise and direct object for params
    if (!params) {
        console.error('params is undefined or null');
        return <div>Error: No params provided</div>;
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    console.log('resolvedParams:', resolvedParams);

    if (!resolvedParams || !resolvedParams.id) {
        console.error('resolvedParams or id is undefined');
        return <div>Error: Invalid member ID</div>;
    }

    const { id } = resolvedParams;
    return <MemberDetailPageClient id={id} />;
}
