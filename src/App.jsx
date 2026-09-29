import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout/Layout";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Customers from "./pages/Customers/Customers";
import Animals from "./pages/Animals/Animal";
import MilkProduction from "./pages/MilkProduction/MilkProduction";
import MilkDelivery from "./pages/MilkDelivery/MilkDelivery";
import Bills from "./pages/Bills/Bills";
import Payments from "./pages/Payments/Payments";
import Reports from './pages/Reports/Reports';
function Placeholder({ title }) {
  return (
    <div>
      <h2>{title}</h2>

      <p className="text-muted">This module will be implemented next.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />

          <Route path="/customers" element={<Customers />} />

          <Route path="/animals" element={<Animals />} />

          <Route path="/milk-production" element={<MilkProduction />} />

          <Route path="/milk-delivery" element={<MilkDelivery />} />

          <Route path="/bills" element={<Bills />} />

          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports/>} />
        </Route>
      </Route>
    </Routes>
  );
}
