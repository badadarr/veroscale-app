import React, { useState, useRef, useEffect } from 'react';
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
  User,
  ChevronDown,
  Clipboard,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';
import NotificationBell from '../ui/NotificationBell';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Define the navigation item type
  type NavItem = {
    name: string;
    href: string;
    icon: React.ElementType;
    roles?: string[];
  };

  // Base navigation items (available to all authenticated users)
  const baseNavigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Samples', href: '/samples', icon: Database },
    // Weight Records only for admin/manager - operators use "My Records" instead
    { name: 'Weight Records', href: '/weights', icon: Weight, roles: ['admin', 'manager'] },
  ];

  // Operations navigation items (mainly for operators)
  const operationsNavigation: NavItem[] = [
    { name: 'Weight Entry', href: '/operations/weight-entry', icon: Scale },
    { name: 'My Records', href: '/operations/my-records', icon: Database },
  ];

  // Role-specific navigation items
  const roleBasedNavigation: NavItem[] = [
    { name: 'Issues', href: '/issues', icon: BarChart2, roles: ['admin', 'manager', 'operator'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'manager'] },
    { name: 'User Management', href: '/users', icon: Users, roles: ['admin'] },
    { name: 'Operator Guide', href: '/operator-guide', icon: BookOpen, roles: ['operator'] },
  ];

  // Filter navigation based on user role
  const navigation: NavItem[] = [
    // Filter base navigation items by role if they have role restrictions
    ...baseNavigation.filter(item =>
      !item.roles || item.roles.includes(user?.role || '')
    ),
    ...(user?.role === 'operator' ? operationsNavigation : []),
    ...roleBasedNavigation.filter(item =>
      item.roles?.includes(user?.role || '') || false
    )
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

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

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
            <div className="flex items-center space-x-2">
              <NotificationBell />
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center text-gray-700 mr-2"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={toggleSidebar}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
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
              </nav>
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

              {/* Profile dropdown for desktop */}
              <div className="hidden lg:flex items-center space-x-4">
                <NotificationBell />
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center text-gray-700 bg-white rounded-full py-1 px-2 border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-2">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-sm font-medium mr-1">{user?.name || 'User'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        My Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
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