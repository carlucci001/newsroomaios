'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { Lead } from '@/types/lead';
import { MapPin, ExternalLink, Globe } from 'lucide-react';

interface InteractiveMapProps {
  leads: Lead[];
}

// US State coordinates (percentage-based positions calibrated to US map)
const stateCoordinates: Record<string, { x: number; y: number }> = {
  'Alabama': { x: 68, y: 68 },
  'Alaska': { x: 10, y: 85 },
  'Arizona': { x: 20, y: 60 },
  'Arkansas': { x: 60, y: 63 },
  'California': { x: 10, y: 55 },
  'Colorado': { x: 35, y: 50 },
  'Connecticut': { x: 88, y: 35 },
  'Delaware': { x: 85, y: 42 },
  'Florida': { x: 78, y: 80 },
  'Georgia': { x: 73, y: 68 },
  'Hawaii': { x: 22, y: 85 },
  'Idaho': { x: 23, y: 30 },
  'Illinois': { x: 64, y: 47 },
  'Indiana': { x: 68, y: 46 },
  'Iowa': { x: 60, y: 40 },
  'Kansas': { x: 52, y: 50 },
  'Kentucky': { x: 70, y: 52 },
  'Louisiana': { x: 62, y: 74 },
  'Maine': { x: 92, y: 22 },
  'Maryland': { x: 83, y: 45 },
  'Massachusetts': { x: 88, y: 32 },
  'Michigan': { x: 69, y: 35 },
  'Minnesota': { x: 60, y: 28 },
  'Mississippi': { x: 63, y: 70 },
  'Missouri': { x: 60, y: 50 },
  'Montana': { x: 32, y: 25 },
  'Nebraska': { x: 50, y: 42 },
  'Nevada': { x: 18, y: 45 },
  'New Hampshire': { x: 88, y: 28 },
  'New Jersey': { x: 85, y: 42 },
  'New Mexico': { x: 33, y: 62 },
  'New York': { x: 84, y: 33 },
  'North Carolina': { x: 78, y: 58 },
  'North Dakota': { x: 50, y: 25 },
  'Ohio': { x: 72, y: 45 },
  'Oklahoma': { x: 52, y: 60 },
  'Oregon': { x: 15, y: 32 },
  'Pennsylvania': { x: 80, y: 42 },
  'Rhode Island': { x: 89, y: 34 },
  'South Carolina': { x: 76, y: 64 },
  'South Dakota': { x: 50, y: 35 },
  'Tennessee': { x: 68, y: 58 },
  'Texas': { x: 48, y: 72 },
  'Utah': { x: 27, y: 47 },
  'Vermont': { x: 86, y: 28 },
  'Virginia': { x: 80, y: 51 },
  'Washington': { x: 17, y: 23 },
  'West Virginia': { x: 76, y: 48 },
  'Wisconsin': { x: 63, y: 32 },
  'Wyoming': { x: 35, y: 38 },
};

// Deterministic offset based on string hash to prevent jitter on re-render
function hashOffset(str: string, index: number): number {
  let hash = 0;
  const s = str + index;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return ((hash % 100) / 100) * 4 - 2; // returns -2 to +2
}

// Build a screenshot thumbnail URL for a live site
function getSiteThumbnailUrl(siteUrl: string): string {
  // Use thum.io free screenshot service
  return `https://image.thum.io/get/width/600/${siteUrl}`;
}

export function InteractiveMap({ leads }: InteractiveMapProps) {
  const [hoveredLead, setHoveredLead] = useState<Lead | null>(null);
  const [thumbError, setThumbError] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((lead: Lead) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    if (hoveredLead?.id !== lead.id) setThumbError(false);
    setHoveredLead(lead);
  }, [hoveredLead?.id]);

  const handleMouseLeave = useCallback(() => {
    hoverTimeout.current = setTimeout(() => setHoveredLead(null), 200);
  }, []);

  // Compute stable pin positions once per data change
  const pins = useMemo(() => {
    return leads
      .map((lead, index) => {
        const coords = stateCoordinates[lead.state];
        if (!coords) return null;

        const isLive = lead.status === 'converted';
        const key = `${lead.id || ''}-${lead.city}-${lead.state}-${index}`;

        return {
          lead,
          isLive,
          key,
          x: coords.x + hashOffset(key, 0),
          y: coords.y + hashOffset(key, 1),
        };
      })
      .filter(Boolean) as Array<{
        lead: Lead;
        isLive: boolean;
        key: string;
        x: number;
        y: number;
      }>;
  }, [leads]);

  // Render reserved (blue) pins first, then live (green) on top
  const sortedPins = useMemo(() => {
    return [...pins].sort((a, b) => (a.isLive ? 1 : 0) - (b.isLive ? 1 : 0));
  }, [pins]);

  return (
    <div className="relative rounded-lg md:rounded-xl border-2 border-brand-blue-200 overflow-hidden bg-white">
      {/* Map Container */}
      <div className="relative w-full" style={{ aspectRatio: '16/10', minHeight: '300px' }}>
        {/* US Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Blank_US_Map_%28states_only%29.svg/1280px-Blank_US_Map_%28states_only%29.svg.png"
            alt="US Map"
            className="w-full h-full object-contain opacity-60"
            style={{ filter: 'contrast(1.1)' }}
          />
        </div>

        {/* Pins */}
        <div className="absolute inset-0">
          {sortedPins.map(({ lead, isLive, key, x, y }) => (
            <div
              key={key}
              className={`absolute ${
                isLive ? 'z-20 cursor-pointer' : 'z-10 cursor-default'
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseEnter={() => handleMouseEnter(lead)}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                if (isLive && lead.siteUrl) {
                  window.open(lead.siteUrl, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              {/* Larger invisible hit area to prevent flicker */}
              <div className="p-3 -m-3">
                {isLive ? (
                  <div className="relative w-fit">
                    <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-green-500 border-2 border-white shadow-lg transition-transform duration-150 hover:scale-125" />
                    <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
                  </div>
                ) : (
                  <div className="h-3 w-3 md:h-4 md:w-4 rounded-full bg-blue-500 border-2 border-white shadow-md transition-transform duration-150 hover:scale-110" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-white/95 rounded-lg shadow-lg p-2 md:p-4 border-2 border-brand-blue-100">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <div className="h-3 w-3 md:h-4 md:w-4 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
            <span className="text-xs md:text-sm font-medium">Reserved</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-3 w-3 md:h-4 md:w-4 rounded-full bg-green-500 border-2 border-white shadow-sm" />
            <span className="text-xs md:text-sm font-medium">Live Newspaper</span>
          </div>
        </div>
      </div>

      {/* Hover card */}
      {hoveredLead && (
        <div className="hidden md:block absolute top-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 w-72 overflow-hidden z-50 pointer-events-none">
          {/* Thumbnail area */}
          <div className="relative h-36 bg-gray-100 overflow-hidden">
            {hoveredLead.status === 'converted' && hoveredLead.siteUrl && !thumbError ? (
              <img
                src={getSiteThumbnailUrl(hoveredLead.siteUrl)}
                alt={hoveredLead.newspaperName || 'Newspaper preview'}
                className="w-full h-full object-cover object-top"
                onError={() => setThumbError(true)}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${
                hoveredLead.status === 'converted'
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}>
                <span className="text-5xl font-bold text-white/90">
                  {(hoveredLead.newspaperName || hoveredLead.city || 'N')[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-4">
            <h4 className="font-bold text-base text-gray-900 leading-tight">
              {hoveredLead.newspaperName || 'New Territory'}
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              {hoveredLead.city}, {hoveredLead.state}
            </p>
            {hoveredLead.county && (
              <p className="text-xs text-gray-400">{hoveredLead.county}</p>
            )}

            {hoveredLead.status === 'converted' && hoveredLead.siteUrl ? (
              <div className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg">
                <Globe className="h-4 w-4" />
                Visit Site
                <ExternalLink className="h-3 w-3" />
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg">
                <MapPin className="h-4 w-4" />
                Territory Reserved
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {leads.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center p-8">
            <MapPin className="h-16 w-16 text-brand-blue-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">
              Be the first to reserve your spot!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
