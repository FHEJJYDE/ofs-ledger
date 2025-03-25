import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import { DashboardLayout } from "./components/dashboard/layout";
import { AdminLayout } from "./components/admin/layout";
import PrivateRoute from "./components/auth/PrivateRoute";
import AdminRoute from "./components/auth/AdminRoute";
import "./styles/globals.css";

// Public Pages
import Index from "./pages/Index";
import About from "./pages/About";
import Team from "./pages/Team";
import Careers from "./pages/Careers";
import FAQ from "./pages/FAQ";
import Documentation from "./pages/Documentation";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AdminLogin from "./pages/admin/Login";
import Validate from "./pages/Validate";
import Terms from "./pages/Terms";

// Dashboard Pages
import Dashboard from "./pages/dashboard/Index";
import AdminDashboard from "./pages/admin/Dashboard";
import FirstAdmin from "./pages/admin/setup/FirstAdmin";
import UserManagement from "./pages/admin/users/Index";
import CreateUser from "./pages/admin/users/Create";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/team" element={<Team />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/validate" element={<Validate />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/admin/setup" element={<FirstAdmin />} />
            </Route>

            {/* User Dashboard Routes */}
            <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/assets" element={<div>Assets Page</div>} />
              <Route path="/dashboard/transactions" element={<div>Transactions Page</div>} />
              <Route path="/dashboard/history" element={<div>History Page</div>} />
              <Route path="/dashboard/settings" element={<div>Settings Page</div>} />
            </Route>

            {/* Admin Dashboard Routes */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/users/create" element={<CreateUser />} />
              <Route path="/admin/assets" element={<div>Assets Management</div>} />
              <Route path="/admin/analytics" element={<div>Analytics Dashboard</div>} />
              <Route path="/admin/security" element={<div>Security Settings</div>} />
              <Route path="/admin/settings" element={<div>Admin Settings</div>} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
