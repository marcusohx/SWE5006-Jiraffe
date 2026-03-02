import { Suspense, type ReactNode } from "react";
import { CreateTicketModal } from "@/components/tickets/CreateTicketModal";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e9f4f2,transparent_55%),radial-gradient(circle_at_20%_20%,#fdf1e7,transparent_45%)]">
        <Suspense>
          <CreateTicketModal />
        </Suspense>
        <div className="flex">
          <Sidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <Topbar />
            <main className="flex-1 px-6 py-8 lg:px-10">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
