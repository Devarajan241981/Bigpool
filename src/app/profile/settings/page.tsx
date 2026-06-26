import { permanentRedirect } from 'next/navigation';
export default function OldSettingsPage() {
  permanentRedirect('/customer/profile/settings');
}
