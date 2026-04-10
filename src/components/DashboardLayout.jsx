import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, Settings, LayoutGrid, LogOut, ArrowUpRight } from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-foreground flex flex-col md:flex-row max-w-[1440px] mx-auto overflow-hidden shadow-2xl">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-white/10 p-6 z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Wallet className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            NexusVault
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(124,58,237,0.3)]' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-red-400 transition-colors">
            <LogOut size={20} />
            <span>Disconnect</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen scrollbar-hide">
        {/* Mobile Header */}
        <header className="md:hidden glass p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Wallet className="text-white" size={16} />
            </div>
            <span className="font-bold">NexusVault</span>
          </div>
          <div className="flex gap-4">
             <Link to="/dashboard"><LayoutGrid size={24} /></Link>
             <Link to="/settings"><Settings size={24} /></Link>
          </div>
        </header>

        <div className="p-4 md:p-8 md:max-w-6xl w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;