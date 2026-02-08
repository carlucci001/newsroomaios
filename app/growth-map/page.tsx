'use client';

import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { InteractiveMap } from '@/components/map/InteractiveMap';
import { ActivityFeed } from '@/components/map/ActivityFeed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, TrendingUp, Users, Zap } from 'lucide-react';
import { getDb } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Lead, LeadActivity } from '@/types/lead';

// Map state abbreviations to full names, then normalize to title case
const STATE_ABBREVS: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming',
};

function normalizeState(state: string): string {
  // Check if it's an abbreviation (1-2 uppercase letters)
  const upper = state.trim().toUpperCase();
  if (STATE_ABBREVS[upper]) return STATE_ABBREVS[upper];

  // Otherwise title-case it (e.g. "OHIO" → "Ohio", "north carolina" → "North Carolina")
  return state
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function GrowthMapPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [liveTenants, setLiveTenants] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [stats, setStats] = useState({
    totalReservations: 0,
    livePapers: 0,
    thisMonth: 0
  });

  // Combine leads + live tenants for the map
  const allMapPins = [...leads, ...liveTenants];

  useEffect(() => {
    const db = getDb();

    // Subscribe to leads (no orderBy to avoid index issues)
    const leadsQuery = query(collection(db, 'leads'));
    const unsubscribeLeads = onSnapshot(leadsQuery, (snapshot) => {
      console.log('[GrowthMap] Leads loaded:', snapshot.size);
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(leadsData);

      // Calculate stats
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthCount = leadsData.filter(
        lead => lead.createdAt?.toDate?.() >= thisMonthStart
      ).length;

      setStats(prev => ({
        ...prev,
        totalReservations: leadsData.length,
        thisMonth: thisMonthCount
      }));
    }, (error) => {
      console.error('[GrowthMap] Leads listener error:', error);
    });

    // Subscribe to tenants - show active ones on the map as green pins
    const tenantsQuery = query(collection(db, 'tenants'));
    const unsubscribeTenants = onSnapshot(tenantsQuery, (snapshot) => {
      console.log('[GrowthMap] Tenants loaded:', snapshot.size);
      const activeTenants: Lead[] = [];
      snapshot.docs.forEach(doc => {
        const tenant = doc.data();
        console.log('[GrowthMap] Tenant:', tenant.businessName, 'status:', tenant.status, 'serviceArea:', JSON.stringify(tenant.serviceArea));
        if (tenant.status === 'active' && tenant.serviceArea) {
          activeTenants.push({
            id: doc.id,
            name: tenant.ownerName || tenant.businessName || '',
            email: tenant.ownerEmail || '',
            phone: tenant.ownerPhone || tenant.phone || '',
            newspaperName: tenant.businessName,
            city: tenant.serviceArea.city || '',
            state: normalizeState(tenant.serviceArea.state || ''),
            status: 'converted' as const,
            source: 'direct' as const,
            siteUrl: tenant.siteUrl || '',
            createdAt: tenant.createdAt,
          });
        }
      });
      console.log('[GrowthMap] Active tenants for map:', activeTenants.length, activeTenants.map(t => t.city + ', ' + t.state));
      setLiveTenants(activeTenants);
      setStats(prev => ({
        ...prev,
        livePapers: activeTenants.length
      }));
    }, (error) => {
      console.error('[GrowthMap] Tenants listener error:', error);
    });

    // Subscribe to recent activities (we'll create these when leads are added)
    const activitiesQuery = query(
      collection(db, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const unsubscribeActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeadActivity[];
      setActivities(activitiesData);
    });

    return () => {
      unsubscribeLeads();
      unsubscribeTenants();
      unsubscribeActivities();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-50/40 via-background to-brand-gray-50/40" />
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-brand-blue-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <SiteHeader onGetStarted={() => {}} />

      <main className="relative flex-1 py-6 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-50 border border-brand-blue-200/60 mb-4 md:mb-6">
              <TrendingUp className="h-4 w-4 text-brand-blue-600" />
              <span className="text-sm font-semibold text-brand-blue-700">Live Growth Map</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-3 md:mb-4 px-4">
              Watch Our <span className="text-brand-blue-600">Nationwide Expansion</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              See where newspapers are reserving territories and launching across America in real-time.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-blue-100 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reserved Spots</p>
                    <p className="text-3xl font-display font-bold text-brand-blue-600">
                      {stats.totalReservations}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-500/50 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Live Papers</p>
                    <p className="text-3xl font-display font-bold text-green-600">
                      {stats.livePapers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-500/50 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-3xl font-display font-bold text-purple-600">
                      {stats.thisMonth}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map and Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Map */}
            <div className="lg:col-span-2 order-1">
              <Card className="border-2 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl md:text-2xl font-display">Interactive Growth Map</CardTitle>
                  <CardDescription className="text-sm">
                    Blue pins = Reserved • Green pins = Live
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 md:p-6">
                  <InteractiveMap leads={allMapPins} />
                </CardContent>
              </Card>
            </div>

            {/* Activity Feed */}
            <div className="lg:col-span-1 order-2">
              <ActivityFeed activities={activities} />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
