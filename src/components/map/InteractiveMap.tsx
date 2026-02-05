'use client';

import { useState } from 'react';
import { Lead } from '@/types/lead';
import { MapPin, Building2 } from 'lucide-react';

interface InteractiveMapProps {
  leads: Lead[];
}

// US State coordinates (approximate center points for visualization)
const stateCoordinates: Record<string, { x: number; y: number }> = {
  'Alabama': { x: 650, y: 520 },
  'Alaska': { x: 100, y: 650 },
  'Arizona': { x: 200, y: 450 },
  'Arkansas': { x: 550, y: 450 },
  'California': { x: 100, y: 350 },
  'Colorado': { x: 350, y: 350 },
  'Connecticut': { x: 850, y: 250 },
  'Delaware': { x: 800, y: 300 },
  'Florida': { x: 750, y: 600 },
  'Georgia': { x: 700, y: 500 },
  'Hawaii': { x: 250, y: 650 },
  'Idaho': { x: 200, y: 200 },
  'Illinois': { x: 600, y: 300 },
  'Indiana': { x: 650, y: 320 },
  'Iowa': { x: 550, y: 280 },
  'Kansas': { x: 500, y: 380 },
  'Kentucky': { x: 650, y: 380 },
  'Louisiana': { x: 550, y: 550 },
  'Maine': { x: 900, y: 150 },
  'Maryland': { x: 780, y: 320 },
  'Massachusetts': { x: 850, y: 230 },
  'Michigan': { x: 650, y: 230 },
  'Minnesota': { x: 550, y: 180 },
  'Mississippi': { x: 600, y: 520 },
  'Missouri': { x: 550, y: 380 },
  'Montana': { x: 300, y: 150 },
  'Nebraska': { x: 450, y: 320 },
  'Nevada': { x: 150, y: 320 },
  'New Hampshire': { x: 850, y: 200 },
  'New Jersey': { x: 820, y: 280 },
  'New Mexico': { x: 320, y: 450 },
  'New York': { x: 800, y: 230 },
  'North Carolina': { x: 750, y: 420 },
  'North Dakota': { x: 450, y: 180 },
  'Ohio': { x: 700, y: 320 },
  'Oklahoma': { x: 480, y: 450 },
  'Oregon': { x: 120, y: 200 },
  'Pennsylvania': { x: 760, y: 300 },
  'Rhode Island': { x: 870, y: 250 },
  'South Carolina': { x: 730, y: 470 },
  'South Dakota': { x: 450, y: 250 },
  'Tennessee': { x: 650, y: 430 },
  'Texas': { x: 420, y: 530 },
  'Utah': { x: 250, y: 320 },
  'Vermont': { x: 830, y: 190 },
  'Virginia': { x: 750, y: 370 },
  'Washington': { x: 140, y: 130 },
  'West Virginia': { x: 720, y: 350 },
  'Wisconsin': { x: 600, y: 220 },
  'Wyoming': { x: 320, y: 260 },
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
    <div className="relative bg-gradient-to-br from-brand-blue-50 to-white rounded-xl border-2 border-brand-blue-100 p-8">
      {/* SVG Map Container */}
      <svg
        viewBox="0 0 1000 700"
        className="w-full h-auto"
        style={{ maxHeight: '600px' }}
      >
        {/* Background */}
        <rect width="1000" height="700" fill="#f0f9ff" />

        {/* Grid lines for visual appeal */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0f2fe" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="1000" height="700" fill="url(#grid)" />

        {/* Map markers */}
        {Object.entries(leadsByLocation).map(([location, { lead, count }]) => {
          const coords = stateCoordinates[lead.state];
          if (!coords) return null;

          // Add some randomness so pins don't overlap perfectly
          const x = coords.x + (Math.random() - 0.5) * 40;
          const y = coords.y + (Math.random() - 0.5) * 40;
          const isReserved = lead.status === 'reserved';

          return (
            <g
              key={location}
              transform={`translate(${x}, ${y})`}
              className="cursor-pointer transition-transform hover:scale-125"
              onMouseEnter={() => setHoveredLead(lead)}
              onMouseLeave={() => setHoveredLead(null)}
            >
              {/* Pin shadow */}
              <circle
                cx="0"
                cy="25"
                r="8"
                fill="black"
                opacity="0.2"
              />

              {/* Pin */}
              <circle
                cx="0"
                cy="0"
                r="12"
                fill={isReserved ? '#3b82f6' : '#10b981'}
                stroke="white"
                strokeWidth="2"
                className="animate-pulse"
              />

              {/* Count badge */}
              {count > 1 && (
                <>
                  <circle cx="8" cy="-8" r="8" fill="#ef4444" stroke="white" strokeWidth="1.5" />
                  <text
                    x="8"
                    y="-5"
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {count}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(50, 620)">
          <rect width="300" height="60" fill="white" opacity="0.9" rx="8" />
          <circle cx="20" cy="20" r="8" fill="#3b82f6" />
          <text x="35" y="25" fontSize="14" fill="#374151">Reserved Territory</text>
          <circle cx="20" cy="45" r="8" fill="#10b981" />
          <text x="35" y="50" fontSize="14" fill="#374151">Live Newspaper</text>
        </g>
      </svg>

      {/* Hover tooltip */}
      {hoveredLead && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-2xl p-4 border-2 border-brand-blue-200 max-w-xs z-10 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
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
              <p className="text-xs text-brand-blue-600 font-semibold mt-1">
                {hoveredLead.status === 'reserved' ? '🔵 Reserved' : '🟢 Live'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {leads.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-brand-blue-300 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              Be the first to reserve your spot!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
