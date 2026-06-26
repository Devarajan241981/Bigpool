import { permanentRedirect } from 'next/navigation';
import { use } from 'react';
export default function OldProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  permanentRedirect(`/customer/products/${id}`);
}
