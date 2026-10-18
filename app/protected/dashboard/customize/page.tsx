import { DashboardEditor } from "@/components/dashboard/dashboard-editor";

// Dashboard edit mode — reached from Settings → Dashboard. Works on a draft
// of the layout; nothing is stored until Save.
export default function CustomizeDashboardPage() {
  return <DashboardEditor />;
}
