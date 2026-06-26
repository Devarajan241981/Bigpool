import { permanentRedirect } from 'next/navigation';
export default function OldCheckoutPage() {
  permanentRedirect('/customer/checkout');
}
