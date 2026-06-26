import { permanentRedirect } from 'next/navigation';
export default function OldWalletPage() {
  permanentRedirect('/customer/profile/wallet');
}
