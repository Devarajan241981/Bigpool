import { permanentRedirect } from 'next/navigation';
export default function OldProfilePage() {
  permanentRedirect('/customer/profile');
}
