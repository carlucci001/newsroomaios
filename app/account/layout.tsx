'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { AntdProvider, useTheme } from '@/components/providers/AntdProvider';
import { Switch } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import {
  HomeIcon,
  CreditCard,
  Coins,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Newspaper,
  ExternalLink,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/account', icon: HomeIcon },
  { label: 'Billing', href: '/account/billing', icon: CreditCard },
  { label: 'Credits', href: '/account/credits', icon: Coins },
  { label: 'Messages', href: '/account/messages', icon: MessageSquare },
  { label: 'Settings', href: '/account/settings', icon: Settings },
];

function AccountLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const auth = getAuthInstance();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/account/login');
        return;
      }

      setUser(firebaseUser);
      const userTenant = await getUserTenant(firebaseUser.uid);
      setTenant(userTenant);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    const auth = getAuthInstance();
    await signOut(auth);
    router.push('/account/login');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
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
          <Link href="/account" className="flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-brand-600" />
            <span className={`font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>newsroomaios</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden p-1 rounded-md ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Tenant Info */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {tenant ? (
            <>
              <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {tenant.businessName}
              </p>
              <p className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {tenant.plan || 'Starter'} Plan
              </p>
            </>
          ) : (
            <>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Platform Admin
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Full system access
              </p>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-brand-50 text-brand-700'
                    : isDark
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="px-3 py-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-medium text-white">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {user.email}
                </p>
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

              {tenant?.domain && (
                <Link
                  href={`https://${tenant.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Your Newspaper</span>
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isDark ? 'text-red-400 hover:bg-red-950' : 'text-danger-600 hover:bg-danger-50'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className={`sticky top-0 z-20 border-b shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="h-16 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex-1">
              <h1 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {navigation.find((item) => item.href === pathname)?.label || 'Account'}
              </h1>
            </div>

            {tenant?.domain && (
              <Link
                href={`https://${tenant.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden sm:flex items-center gap-1 text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <span>View Newspaper</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}

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

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdProvider>
      <AccountLayoutContent>{children}</AccountLayoutContent>
    </AntdProvider>
  );
}
