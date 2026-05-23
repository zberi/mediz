import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { PrescriptionProvider } from "@/context/PrescriptionContext";
import { Header, BottomNav } from "@/components/layout/Navigation";
import { ChatButton } from "@/components/chat/ChatButton";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { VoiceOrderButton } from "@/components/voice-order/VoiceOrderButton";
import { QuickOrderBanner } from "@/components/quick-order/QuickOrderBanner";

import MedicinesPage from "./pages/MedicinesPage";
import MedicineDetailPage from "./pages/MedicineDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <PrescriptionProvider>
          <ChatProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Header />
                <QuickOrderBanner />
                <main>
                  <Routes>
                    <Route path="/" element={<MedicinesPage />} />
                    <Route path="/medicine/:id" element={<MedicineDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/order/:id" element={<OrderDetailPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <BottomNav />
                <VoiceOrderButton />
                <ChatButton />
                <ChatWidget />
              </div>
            </BrowserRouter>
          </TooltipProvider>
          </ChatProvider>
        </PrescriptionProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
