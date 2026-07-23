import { DashboardShell } from "../components/dashboard/dashboard-shell";
import { SummaryContent } from "../components/dashboard/summary-content";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <SummaryContent />
    </DashboardShell>
  );
}