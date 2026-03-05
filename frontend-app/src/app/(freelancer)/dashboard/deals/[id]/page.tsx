import { use } from 'react';
import { DealBuilder } from '../_components/DealBuilder';

// This is the main server component that receives the [id] param
export default function DealPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    // We could fetch initial deal data here and pass it as a prop
    return <DealBuilder dealId={id} />;
}
