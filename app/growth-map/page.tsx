'use client';

import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { InteractiveMap } from '@/components/map/InteractiveMap';
import { ActivityFeed } from '@/components/map/ActivityFeed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, TrendingUp, Users, Zap } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Lead, LeadActivity } from '@/types/lead';

export default function GrowthMapPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [stats, setStats] = useState({
    totalReservations: 0,
    livePapers: 0,
    thisMonth: 0
  });

  useEffect(() => {
    // Subscribe to leads
    const leadsQuery = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribeLeads = onSnapshot(leadsQuery, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(leadsData);

      // Calculate stats
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthCount = leadsData.filter(
        lead => lead.createdAt?.toDate() >= thisMonthStart
      ).length;

      setStats(prev => ({
        ...prev,
        totalReservations: leadsData.length,
        thisMonth: thisMonthCount
      }));
    });

    // Subscribe to tenants for live papers count
    const tenantsQuery = query(collection(db, 'tenants'));
    const unsubscribeTenants = onSnapshot(tenantsQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        livePapers: snapshot.size
      }));
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

      <main className="relative flex-1 py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-50 border border-brand-blue-200/60 mb-6">
              <TrendingUp className="h-4 w-4 text-brand-blue-600" />
              <span className="text-sm font-semibold text-brand-blue-700">Live Growth Map</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-4">
              Watch Our <span className="text-brand-blue-600">Nationwide Expansion</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See where newspapers are reserving territories and launching across America in real-time.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
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
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="border-2 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-display">Interactive Growth Map</CardTitle>
                  <CardDescription>
                    Blue pins = Reserved territories • Green pins = Live newspapers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InteractiveMap leads={leads} />
                </CardContent>
              </Card>
            </div>

            {/* Activity Feed */}
            <div className="lg:col-span-1">
              <ActivityFeed activities={activities} />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
