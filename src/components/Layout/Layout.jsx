import { Outlet } from 'react-router-dom';

import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';

export default function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-area">
        <Header />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}