'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { Lead } from '@/types/lead';
import { MapPin, ExternalLink, Globe, Mail, Phone, ArrowRight } from 'lucide-react';

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

// Spread same-state pins in a circle so they don't overlap
function getSpreadOffset(indexInState: number, totalInState: number): { dx: number; dy: number } {
  if (totalInState <= 1) return { dx: 0, dy: 0 };
  const radius = 3; // percentage spread radius
  const angle = (2 * Math.PI * indexInState) / totalInState - Math.PI / 2;
  return {
    dx: radius * Math.cos(angle),
    dy: radius * Math.sin(angle),
  };
}

// Build a screenshot thumbnail URL for a live site
function getSiteThumbnailUrl(siteUrl: string): string {
  return `https://image.thum.io/get/width/600/${siteUrl}`;
}

// Pin color config per category
const PIN_COLORS: Record<string, string> = {
  sold: '#d97706',
  available: '#16a34a',
  pending: '#3b82f6',
};

// Z-index layering: SOLD on top, then Available, then Pending
const PIN_Z: Record<string, number> = {
  sold: 30,
  available: 20,
  pending: 10,
};

// SOLD yard sign SVG rendered next to a pin
function SoldSign() {
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" className="absolute -right-3 -top-1 drop-shadow-md">
      {/* Post */}
      <rect x="9" y="10" width="2" height="14" rx="0.5" fill="#92400e" />
      {/* Sign */}
      <rect x="1" y="1" width="18" height="11" rx="1.5" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
      {/* SOLD text */}
      <text x="10" y="9" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial, sans-serif">SOLD</text>
    </svg>
  );
}

export function InteractiveMap({ leads }: InteractiveMapProps) {
  const [hoveredLead, setHoveredLead] = useState<Lead | null>(null);
  const [thumbError, setThumbError] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((lead: Lead) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    if (enterTimeout.current) clearTimeout(enterTimeout.current);
    // Require hovering on the pin for 300ms before showing the card
    enterTimeout.current = setTimeout(() => {
      if (hoveredLead?.id !== lead.id) setThumbError(false);
      setHoveredLead(lead);
    }, 300);
  }, [hoveredLead?.id]);

  const handleMouseLeave = useCallback(() => {
    if (enterTimeout.current) clearTimeout(enterTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoveredLead(null), 150);
  }, []);

  // Compute stable pin positions — spread same-state pins so they don't overlap
  const pins = useMemo(() => {
    // Group leads by state to know how many share each state
    const stateGroups: Record<string, number[]> = {};
    leads.forEach((lead, index) => {
      if (stateCoordinates[lead.state]) {
        if (!stateGroups[lead.state]) stateGroups[lead.state] = [];
        stateGroups[lead.state].push(index);
      }
    });

    return leads
      .map((lead, index) => {
        const coords = stateCoordinates[lead.state];
        if (!coords) return null;

        const category = lead.category || (lead.status === 'converted' ? 'available' : 'pending');
        const key = `${lead.id || ''}-${lead.city}-${lead.state}-${index}`;
        const group = stateGroups[lead.state];
        const indexInState = group.indexOf(index);
        const { dx, dy } = getSpreadOffset(indexInState, group.length);

        return {
          lead,
          category,
          key,
          x: coords.x + dx,
          y: coords.y + dy,
        };
      })
      .filter(Boolean) as Array<{
        lead: Lead;
        category: 'sold' | 'available' | 'pending';
        key: string;
        x: number;
        y: number;
      }>;
  }, [leads]);

  // Render pending first (z-10), then available (z-20), then sold on top (z-30)
  const sortedPins = useMemo(() => {
    return [...pins].sort((a, b) => (PIN_Z[a.category] || 0) - (PIN_Z[b.category] || 0));
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
          {sortedPins.map(({ lead, category, key, x, y }) => {
            const pinColor = PIN_COLORS[category] || '#3b82f6';
            const isSold = category === 'sold';
            const isAvailable = category === 'available';
            const isPending = category === 'pending';
            const isClickable = isSold || isAvailable;
            const pinSize = isPending ? { w: 18, h: 24 } : { w: 22, h: 30 };

            return (
              <div
                key={key}
                className={`absolute cursor-pointer`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -100%)',
                  zIndex: PIN_Z[category] || 10,
                }}
                onMouseEnter={() => handleMouseEnter(lead)}
                onMouseLeave={handleMouseLeave}
                onClick={() => {
                  if (isClickable && lead.siteUrl) {
                    window.open(lead.siteUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                <div className="relative transition-transform duration-150 hover:scale-125">
                  <svg
                    width={pinSize.w}
                    height={pinSize.h}
                    viewBox="0 0 24 36"
                    className="drop-shadow-lg"
                  >
                    <path
                      d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
                      fill={pinColor}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <circle cx="12" cy="11" r="4.5" fill="white" />
                  </svg>
                  {isSold && <SoldSign />}
                  {isAvailable && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-white" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-white/95 rounded-lg shadow-lg p-2 md:p-3 border-2 border-brand-blue-100 space-y-1 md:space-y-1.5">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative" style={{ width: 28, height: 18 }}>
              <svg width="14" height="18" viewBox="0 0 24 36">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#d97706" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="11" r="4.5" fill="white" />
              </svg>
              <svg width="12" height="14" viewBox="0 0 20 24" className="absolute top-0" style={{ left: 14 }}>
                <rect x="9" y="8" width="2" height="14" rx="0.5" fill="#92400e" />
                <rect x="1" y="1" width="18" height="9" rx="1.5" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
                <text x="10" y="8" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial, sans-serif">SOLD</text>
              </svg>
            </div>
            <span className="text-xs md:text-sm font-semibold text-amber-700">Sold</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div style={{ width: 28, height: 18 }}>
              <svg width="14" height="18" viewBox="0 0 24 36">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#16a34a" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="11" r="4.5" fill="white" />
              </svg>
            </div>
            <span className="text-xs md:text-sm font-semibold text-green-700">Available</span>
          </div>
          {leads.some(l => l.category === 'pending' || l.status !== 'converted') && (
            <div className="flex items-center gap-2 md:gap-3">
              <div style={{ width: 28, height: 18 }}>
                <svg width="12" height="16" viewBox="0 0 24 36">
                  <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#3b82f6" stroke="white" strokeWidth="2" />
                  <circle cx="12" cy="11" r="4.5" fill="white" />
                </svg>
              </div>
              <span className="text-xs md:text-sm font-semibold text-blue-700">Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover card */}
      {hoveredLead && (() => {
        const cat = hoveredLead.category || (hoveredLead.status === 'converted' ? 'available' : 'pending');
        const isSold = cat === 'sold';
        const isAvailable = cat === 'available';
        const isPending = cat === 'pending';
        const hasLiveSite = (isSold || isAvailable) && hoveredLead.siteUrl;

        const badgeConfig = isSold
          ? { text: 'SOLD', bg: 'bg-red-600', textColor: 'text-white' }
          : isAvailable
            ? { text: 'Available', bg: 'bg-green-600', textColor: 'text-white' }
            : { text: 'Pending', bg: 'bg-blue-600', textColor: 'text-white' };

        const fallbackGradient = isSold
          ? 'from-amber-500 to-amber-700'
          : isAvailable
            ? 'from-green-500 to-emerald-600'
            : 'from-blue-500 to-indigo-600';

        return (
          <div
            className="hidden md:block absolute top-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 w-72 overflow-hidden z-50"
            onMouseEnter={() => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); }}
            onMouseLeave={handleMouseLeave}
          >
            {/* Thumbnail area */}
            {hasLiveSite ? (
              <a href={hoveredLead.siteUrl} target="_blank" rel="noopener noreferrer" className="block">
                <div className="relative h-36 bg-gray-100 overflow-hidden group">
                  {!thumbError ? (
                    <img
                      src={getSiteThumbnailUrl(hoveredLead.siteUrl!)}
                      alt={hoveredLead.newspaperName || 'Newspaper preview'}
                      className="w-full h-full object-cover object-top"
                      onError={() => setThumbError(true)}
                    />
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${fallbackGradient} p-4`}>
                      <span className="text-2xl font-bold text-white text-center leading-tight">
                        {hoveredLead.newspaperName || hoveredLead.city}
                      </span>
                      <span className="text-xs text-white/70 mt-1">
                        {hoveredLead.city}, {hoveredLead.state}
                      </span>
                    </div>
                  )}
                  {isSold && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded shadow-md uppercase tracking-wider">
                      SOLD
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-semibold flex items-center gap-1">
                      <ExternalLink className="h-4 w-4" /> Visit Site
                    </span>
                  </div>
                </div>
              </a>
            ) : (
              <div className={`relative h-36 bg-gradient-to-br ${fallbackGradient} flex flex-col items-center justify-center p-4`}>
                <span className="text-2xl font-bold text-white text-center leading-tight">
                  {hoveredLead.newspaperName || hoveredLead.city || 'New Territory'}
                </span>
                <span className="text-xs text-white/70 mt-1">
                  {hoveredLead.city}, {hoveredLead.state}
                </span>
              </div>
            )}

            {/* Category badge + Details */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeConfig.bg} ${badgeConfig.textColor}`}>
                  {badgeConfig.text}
                </span>
              </div>
              <h4 className="font-bold text-base text-gray-900 leading-tight">
                {hoveredLead.newspaperName || 'New Territory'}
              </h4>
              <p className="text-sm text-gray-500 mt-0.5">
                {hoveredLead.city}, {hoveredLead.state}
              </p>
              {hoveredLead.county && (
                <p className="text-xs text-gray-400">{hoveredLead.county}</p>
              )}

              {/* Contact info for pending */}
              {isPending && (hoveredLead.name || hoveredLead.email || hoveredLead.phone) && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                  {hoveredLead.name && (
                    <p className="text-sm font-medium text-gray-700">{hoveredLead.name}</p>
                  )}
                  {hoveredLead.email && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-gray-400" />
                      {hoveredLead.email}
                    </p>
                  )}
                  {hoveredLead.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-gray-400" />
                      {hoveredLead.phone}
                    </p>
                  )}
                </div>
              )}

              {/* Action button per category */}
              {isSold && hoveredLead.siteUrl ? (
                <a
                  href={hoveredLead.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 transition-colors text-white text-sm font-semibold rounded-lg"
                >
                  <Globe className="h-4 w-4" />
                  Visit Site
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : isAvailable ? (
                <a
                  href="/?view=leadCapture"
                  className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-600 hover:bg-green-700 transition-colors text-white text-sm font-semibold rounded-lg"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <div className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg">
                  <MapPin className="h-4 w-4" />
                  Territory Reserved
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
