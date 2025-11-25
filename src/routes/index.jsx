import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Loader from "../components/common/Loader";
import ProtectedRoute from "../components/common/ProtectedRoute";
import MainLayout from "../Layouts/MainLayout";

// Lazy-loaded pages
const Login = lazy(() => import("../pages/Login"));
const POS = lazy(() => import("../pages/POS"));
const ProductManagement = lazy(() => import("../pages/Product"));
const OrderOfflineOverview = lazy(() => import("../pages/OrderOffline"));
const OrderOnlineOverview = lazy(() => import("../pages/OrderOnline"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const ClosingPOS = lazy(() => import("../pages/ClosingPOS"));
const StartOfDay = lazy(() => import("../pages/StartOfDay"));
const EndOfDay = lazy(() => import("../pages/EndOfDay"));
const MejaPage = lazy(() => import("../pages/Table"));
const Kas = lazy(() => import("../pages/Kas"));
const CustomerDisplay = lazy(() => import("../pages/CustomerDisplay"));
const Payout = lazy(() => import("../pages/Payout"));

export default function Router() {
  return (
    <Suspense fallback={<Loader show={true} message="Loading..." />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/customer-display" element={<CustomerDisplay />} />

        {/* Routes with Mainlayout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/pos" element={<POS />} />
          <Route path="/product" element={<ProductManagement />} />
          <Route path="/order-offline" element={<OrderOfflineOverview />} />
          <Route path="/order-online" element={<OrderOnlineOverview />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report" element={<ClosingPOS />} />
          <Route path="/table" element={<MejaPage />} />
          <Route path="/kas" element={<Kas />} />
          <Route path="/sod" element={<StartOfDay />} />
          <Route path="/eod" element={<EndOfDay />} />
          <Route path="/payout" element={<Payout />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
