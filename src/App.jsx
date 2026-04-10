import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import CoinDetail from "./pages/CoinDetail";
import Settings from "./pages/Settings";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Setup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/coin/:id" element={<CoinDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <Toaster position="top-center" theme="dark" />
      </BrowserRouter>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;