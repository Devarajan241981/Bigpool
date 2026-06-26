import { permanentRedirect } from 'next/navigation';
export default function OldWishlistPage() {
  permanentRedirect('/customer/profile/wishlist');
}
