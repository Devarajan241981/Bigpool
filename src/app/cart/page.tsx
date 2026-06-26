import { permanentRedirect } from 'next/navigation';
export default function OldCartPage() {
  permanentRedirect('/customer/cart');
}
