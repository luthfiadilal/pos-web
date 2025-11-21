import { useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLayout } from "../contexts/LayoutContext";
import OfflineBanner from "../components/common/OfflineBanner";

export default function MainLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(true);
  const { showCustomerDisplayButton, isChatbotOpen, setChatbotOpen } =
    useLayout();

  const { user } = useAuth();
  const userName = user?.name || "User Cashier";
  const companyName = user?.company?.company_nm || "PT Wangga Tanghuru";

  const toggleDesktopSidebar = () => {
    setDesktopSidebarCollapsed(!desktopSidebarCollapsed);
  };

  const shouldHideCompanyName = mobileSidebarOpen || !desktopSidebarCollapsed;

  return (
    <>
      {/* Offline Banner */}
      <OfflineBanner />

      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Desktop Sidebar */}
        <div
          className={`hidden md:block ${
            desktopSidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          <Sidebar
            closeSidebar={toggleDesktopSidebar}
            isCollapsed={desktopSidebarCollapsed}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="fixed inset-0 bg-black bg-opacity-40"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <Sidebar closeSidebar={() => setMobileSidebarOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-blue-500 overflow-hidden">
          <Header
            userName={userName}
            companyName={companyName}
            onHamburgerClick={() => setMobileSidebarOpen(true)}
            hideCompanyName={shouldHideCompanyName}
            showCustomerDisplayButton={showCustomerDisplayButton}
          />

          <main className="flex-1 overflow-y-auto bg-white rounded-tl-[16px] relative">
            {isChatbotOpen && (
              <div
                className="absolute inset-0 bg-white  bg-opacity-10 backdrop-blur-sm z-30 rounded-tl-[16px]"
                onClick={() => setChatbotOpen(false)}
              ></div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
