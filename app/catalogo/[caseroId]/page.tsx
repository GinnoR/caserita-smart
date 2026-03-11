import { MobileClientPortal } from "@/components/MobileClientPortal";

export default async function Page({ params }: { params: Promise<{ caseroId: string }> }) {
    // En Next.js 15 los params se resuelven asíncronamente en Server Components
    const resolvedParams = await params;

    return <MobileClientPortal caseroId={resolvedParams.caseroId} />;
}
