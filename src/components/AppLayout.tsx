import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";

export const AppLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
