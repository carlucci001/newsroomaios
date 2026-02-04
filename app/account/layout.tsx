'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
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

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const auth = getAuthInstance();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Not logged in - redirect to login
        router.push('/account/login');
        return;
      }

      setUser(firebaseUser);

      // Get user's tenant (will be null for platform admins)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <Link href="/account" className="flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-brand-600" />
            <span className="font-bold text-gray-900">newsroomaios</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tenant Info / Admin Badge */}
        <div className="px-6 py-4 border-b border-gray-200">
          {tenant ? (
            <>
              <p className="text-sm font-medium text-gray-900 truncate">
                {tenant.businessName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {tenant.plan || 'Starter'} Plan
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900">
                Platform Admin
              </p>
              <p className="text-xs text-gray-500">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
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
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-sm font-medium text-brand-700">
                {user?.email?.[0].toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-danger-600 transition-colors mt-1"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            {tenant?.domain && (
              <Link
                href={`https://${tenant.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-brand-600 transition-colors hidden sm:block"
              >
                View Your Newspaper →
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
