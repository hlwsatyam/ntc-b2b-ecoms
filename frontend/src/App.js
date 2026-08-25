import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth, useSettings } from "./store";
import StoreLayout from "./layouts/StoreLayout";
import AdminLayout from "./layouts/AdminLayout";
import VendorLayout from "./layouts/VendorLayout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import RFQ from "./pages/RFQ";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminBrands from "./pages/admin/Brands";
import AdminOrders from "./pages/admin/Orders";
import AdminVendors from "./pages/admin/Vendors";
import AdminSettings from "./pages/admin/Settings";
import AdminBulkImport from "./pages/admin/BulkImport";
import AdminPayouts from "./pages/admin/Payouts";
import AdminFlashSales from "./pages/admin/FlashSales";
import VendorDashboard from "./pages/vendor/Dashboard";
import VendorProducts from "./pages/vendor/Products";
import VendorOrders from "./pages/vendor/Orders";
import VendorWallet from "./pages/vendor/Wallet";
import "./index.css";

function Protected({ roles, children }) {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function App() {
  const init = useAuth((s) => s.init);
  const fetchSettings = useSettings((s) => s.fetch);

  useEffect(() => {
    fetchSettings();
    init();
  }, [init, fetchSettings]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<StoreLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Protected><Checkout /></Protected>} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="account" element={<Protected><Account /></Protected>} />
          <Route path="rfq" element={<Protected><RFQ /></Protected>} />
        </Route>
        <Route path="/admin" element={<Protected roles={["super_admin", "admin"]}><AdminLayout /></Protected>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="bulk-import" element={<AdminBulkImport />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="vendors" element={<AdminVendors />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="flash-sales" element={<AdminFlashSales />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="/vendor" element={<Protected roles={["vendor"]}><VendorLayout /></Protected>}>
          <Route index element={<VendorDashboard />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="wallet" element={<VendorWallet />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
