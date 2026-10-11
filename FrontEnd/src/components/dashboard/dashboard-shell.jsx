import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export function DashboardShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6">
          <div key={location.pathname} className="dashboard-page dashboard-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
