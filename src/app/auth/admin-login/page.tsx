import { permanentRedirect } from "next/navigation";
export default function OldAdminLoginPage() {
  permanentRedirect("/superadmin/login");
}
