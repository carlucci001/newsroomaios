'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Lead } from '@/types/lead';

interface ReservationsSidebarProps {
  leads: Lead[];
}

export function ReservationsSidebar({ leads }: ReservationsSidebarProps) {
  // Filter to only non-converted leads, sort newest first
  const reservations = useMemo(() => {
    return leads
      .filter(lead => lead.status !== 'converted')
      .sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      });
  }, [leads]);

  return (
    <Card className="border-2 shadow-xl h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-xl font-display">Reserved Territories</CardTitle>
          </div>
          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
            {reservations.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
          {reservations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">
                No reservations yet
              </p>
            </div>
          ) : (
            reservations.map((lead, index) => (
              <div
                key={lead.id || index}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">
                    {(lead.city || 'N')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {lead.newspaperName || 'New Territory'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.city}, {lead.state}
                  </p>
                </div>
                <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Reserved
                </span>
              </div>
            ))
          )}
        </div>

        <style jsx>{`
          div::-webkit-scrollbar {
            width: 4px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background: #dbeafe;
            border-radius: 2px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #93c5fd;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
