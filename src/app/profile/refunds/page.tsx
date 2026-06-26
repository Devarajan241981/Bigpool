import { permanentRedirect } from 'next/navigation';
export default function OldRefundsPage() {
  permanentRedirect('/customer/profile/refunds');
}
