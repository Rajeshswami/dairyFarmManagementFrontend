import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sidebar-open", sidebarOpen);

    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [sidebarOpen]);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <div className="main-area">
        <Header onMenuToggle={() => setSidebarOpen((open) => !open)} />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
