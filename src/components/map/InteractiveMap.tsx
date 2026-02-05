'use client';

import { useState } from 'react';
import { Lead } from '@/types/lead';
import { MapPin, Building2 } from 'lucide-react';
import Image from 'next/image';

interface InteractiveMapProps {
  leads: Lead[];
}

// US State coordinates (percentage-based positions calibrated to US map)
// x: 0-100 (left to right), y: 0-100 (top to bottom)
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

export function InteractiveMap({ leads }: InteractiveMapProps) {
  const [hoveredLead, setHoveredLead] = useState<Lead | null>(null);

  // Group leads by location to show count
  const leadsByLocation = leads.reduce((acc, lead) => {
    const key = `${lead.city}, ${lead.state}`;
    if (!acc[key]) {
      acc[key] = { lead, count: 0 };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { lead: Lead; count: number }>);

  return (
    <div className="relative rounded-xl border-2 border-brand-blue-200 overflow-hidden bg-white">
      {/* Map Container with real US map background */}
      <div className="relative w-full" style={{ aspectRatio: '16/10', minHeight: '500px' }}>
        {/* US Map Background Image */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Blank_US_Map_%28states_only%29.svg/1280px-Blank_US_Map_%28states_only%29.svg.png"
            alt="US Map"
            className="w-full h-full object-contain opacity-60"
            style={{ filter: 'contrast(1.1)' }}
          />
        </div>

        {/* Pins Container */}
        <div className="absolute inset-0">{/* Map markers */}

          {/* Map markers */}
          {Object.entries(leadsByLocation).map(([location, { lead, count }]) => {
            const coords = stateCoordinates[lead.state];
            if (!coords) return null;

            // Use percentage-based positioning
            // Add slight randomness to prevent perfect overlap (±2%)
            const xPercent = coords.x + (Math.random() - 0.5) * 2;
            const yPercent = coords.y + (Math.random() - 0.5) * 2;
            const isReserved = lead.status === 'reserved';

            return (
              <div
                key={location}
                className="absolute cursor-pointer transition-all hover:z-50"
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseEnter={() => setHoveredLead(lead)}
                onMouseLeave={() => setHoveredLead(null)}
              >
                {/* Pin */}
                <div className="relative">
                  <MapPin
                    className={`h-8 w-8 drop-shadow-lg ${
                      isReserved ? 'text-blue-500' : 'text-green-500'
                    }`}
                    fill={isReserved ? '#3b82f6' : '#10b981'}
                  />

                  {/* Count badge */}
                  {count > 1 && (
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{count}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 rounded-lg shadow-lg p-4 border-2 border-brand-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-5 w-5 text-blue-500" fill="#3b82f6" />
            <span className="text-sm font-medium">Reserved Territory</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-green-500" fill="#10b981" />
            <span className="text-sm font-medium">Live Newspaper</span>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredLead && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-2xl p-4 border-2 border-brand-blue-200 max-w-xs z-50">
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
              hoveredLead.status === 'reserved' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {hoveredLead.status === 'reserved' ? (
                <MapPin className="h-5 w-5 text-blue-600" />
              ) : (
                <Building2 className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-sm">
                {hoveredLead.newspaperName || 'New Territory'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {hoveredLead.city}, {hoveredLead.state}
              </p>
              {hoveredLead.county && (
                <p className="text-xs text-muted-foreground">{hoveredLead.county}</p>
              )}
              <p className="text-xs font-semibold mt-1">
                {hoveredLead.status === 'reserved' ? '🔵 Reserved' : '🟢 Live'}
              </p>
            </div>
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
