'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export function MaintenanceModeChecker() {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Don't check on admin or maintenance pages
    if (pathname.startsWith('/admin') || pathname === '/maintenance') {
      setIsChecking(false);
      return;
    }

    // Check environment variable first (emergency override)
    if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
      router.push('/maintenance');
      return;
    }

    // Subscribe to Firestore settings for real-time updates
    const db = getDb();
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'platform'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.maintenanceMode === true) {
            router.push('/maintenance');
          } else {
            setIsChecking(false);
          }
        } else {
          setIsChecking(false);
        }
      },
      (error) => {
        console.error('Failed to check maintenance mode:', error);
        setIsChecking(false);
      }
    );

    return () => unsubscribe();
  }, [pathname, router]);

  // Don't render anything, this is just a background checker
  return null;
}
