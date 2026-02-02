'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function StatusRedirect() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;

  useEffect(() => {
    // Redirect to home page with status modal open
    router.replace(`/?modal=status&id=${tenantId}`);
  }, [router, tenantId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading status...</p>
      </div>
    </div>
  );
}
