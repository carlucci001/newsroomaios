'use client';

import 'antd/dist/reset.css';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAuthInstance } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { AntdProvider, useTheme } from '@/components/providers/AntdProvider';
import { Switch } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import {
  LayoutDashboard,
  Building2,
  Coins,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Users,
  Bot,
  Radar,
  Headset,
  Megaphone,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Leads', href: '/admin/leads', icon: Users },
  { label: 'Tenants', href: '/admin/tenants', icon: Building2 },
  { label: 'Credits', href: '/admin/credits', icon: Coins },
  { label: 'Updates', href: '/admin/updates', icon: Upload },
  { label: 'Releases', href: '/admin/releases', icon: Megaphone },
  { label: 'AI Config', href: '/admin/ai-settings', icon: Bot },
  { label: 'Support', href: '/admin/support', icon: Headset },
  { label: 'Command Center', href: '/admin/command-center', icon: Radar },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
        return;
      }

      // Check platformAdmin custom claim
      const tokenResult = await currentUser.getIdTokenResult(true);
      if (!tokenResult.claims.platformAdmin) {
        // Not a platform admin — sign them out and redirect
        await signOut(auth);
        router.push('/admin/login');
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const handleSignOut = async () => {
    const auth = getAuthInstance();
    await signOut(auth);
    router.push('/admin/login');
  };

  // Show login page without layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center justify-between px-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Link href="/admin" className="flex items-center">
            <img
              src="/newsroom-logo.png"
              alt="Newsroom AIOS"
              className={`h-8 w-auto ${isDark ? 'rounded px-2 py-1 bg-white/90' : ''}`}
            />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden p-1 rounded-md ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Admin Badge */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Platform Admin
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Full system access
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-none active:scale-95 ${
                  isActive
                    ? isDark
                      ? 'bg-blue-600 text-white active:bg-blue-700'
                      : 'bg-brand-50 text-brand-700 active:bg-brand-100'
                    : isDark
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100 active:bg-gray-800'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Version + User Menu */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className={`px-3 pb-2 text-[11px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Platform v{process.env.NEXT_PUBLIC_PLATFORM_VERSION || '—'}
          </div>
          <div className="px-3 py-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-medium text-white">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {user.email}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Administrator</p>
              </div>
            </div>

            <div className="space-y-1">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between px-3 py-2 mb-2">
                <span className={`text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Theme</span>
                <div className="flex items-center gap-2">
                  <SunOutlined style={{ fontSize: '14px', color: isDark ? '#8c8c8c' : '#3b82f6' }} />
                  <Switch
                    checked={isDark}
                    onChange={toggleTheme}
                    size="small"
                  />
                  <MoonOutlined style={{ fontSize: '14px', color: isDark ? '#3b82f6' : '#8c8c8c' }} />
                </div>
              </div>

              <Link
                href="/"
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-none active:scale-95 ${
                  isDark ? 'text-gray-300 hover:bg-gray-700 active:bg-gray-800' : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Main Site</span>
              </Link>
              <button
                onClick={handleSignOut}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-none active:scale-95 ${
                  isDark ? 'text-red-400 hover:bg-red-950 active:bg-red-900' : 'text-danger-600 hover:bg-danger-50 active:bg-danger-100'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className={`sticky top-0 z-20 border-b shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="h-16 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex-1">
              <h1 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {navItems.find((item) => item.href === pathname)?.label || 'Admin Portal'}
              </h1>
            </div>

            <Link
              href="/"
              className={`hidden sm:flex items-center gap-1 text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <span>View Site</span>
              <ExternalLink className="w-4 h-4" />
            </Link>

            {/* Menu button - RIGHT SIDE */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-lg"
              style={{ minWidth: '48px', minHeight: '48px' }}
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AntdProvider>
  );
}
