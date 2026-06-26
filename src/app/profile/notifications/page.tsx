import { permanentRedirect } from 'next/navigation';
export default function OldNotificationsPage() {
  permanentRedirect('/customer/profile/notifications');
}
