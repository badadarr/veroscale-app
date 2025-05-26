import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import {
  Scale,
  LayoutDashboard,
  Users,
  Database,
  Weight,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Samples', href: '/samples', icon: Database },
    { name: 'Weight Records', href: '/weights', icon: Weight },
    { name: 'Reports', href: '/reports', icon: BarChart2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Admin-only menu items
  const adminNavigation = [
    { name: 'User Management', href: '/users', icon: Users },
  ];

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <>
      <Head>
        <title>{`${title} | VeroScale Material System`}</title>
      </Head>

      <div className="min-h-screen bg-gray-100 transition-colors">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden fixed top-0 left-0 z-40 w-full bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <Scale className="h-6 w-6 text-primary-600 mr-2" />
              <span className="text-lg font-semibold">VeroScale</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="px-4 py-6 border-b border-gray-200">
              <div className="flex items-center">
                <Scale className="h-8 w-8 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">VeroScale</h1>
              </div>
            </div>

            <div className="flex-1 px-4 py-6 overflow-y-auto">
              <nav className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive(item.href)
                        ? "bg-primary-100 text-primary-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5",
                        isActive(item.href)
                          ? "text-primary-500"
                          : "text-gray-500 group-hover:text-gray-500"
                      )}
                    />
                    {item.name}
                  </Link>
                ))}

                {/* Admin-only navigation */}
                {user?.role === 'admin' && adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive(item.href)
                        ? "bg-primary-100 text-primary-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5",
                        isActive(item.href)
                          ? "text-primary-500"
                          : "text-gray-500 group-hover:text-gray-500"
                      )}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-6 flex items-center justify-between px-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle theme"
              >
                <Moon className="h-5 w-5 text-gray-500" />
              </button>

              <Button
                onClick={handleLogout}
                variant="ghost"
                className="flex items-center text-gray-700"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className={cn("lg:pl-64 transition-all duration-300 ease-in-out", sidebarOpen ? "pl-64" : "pl-0")}>
          <main className="py-6 px-4 sm:px-6 lg:px-8 mt-12 lg:mt-0">
            <div className="mb-6 md:flex md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
                  {title}
                </h1>
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;