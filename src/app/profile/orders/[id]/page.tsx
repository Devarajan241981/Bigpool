import { permanentRedirect } from 'next/navigation';
import { use } from 'react';
export default function OldOrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  permanentRedirect(`/customer/profile/orders/${id}`);
}
