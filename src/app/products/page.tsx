import { permanentRedirect } from 'next/navigation';
export default function OldProductsPage() {
  permanentRedirect('/customer/products');
}
