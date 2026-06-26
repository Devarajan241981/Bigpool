import { permanentRedirect } from 'next/navigation';
export default function OldOrdersPage() {
  permanentRedirect('/customer/profile/orders');
}
