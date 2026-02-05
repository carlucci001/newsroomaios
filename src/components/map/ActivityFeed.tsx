'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Zap, TrendingUp } from 'lucide-react';
import { LeadActivity } from '@/types/lead';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities: LeadActivity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [visibleActivities, setVisibleActivities] = useState<LeadActivity[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const prevActivitiesLength = useRef(0);

  useEffect(() => {
    // Show activities one by one with animation
    if (activities.length > prevActivitiesLength.current) {
      const newActivities = activities.slice(0, activities.length);
      setVisibleActivities(newActivities);

      // Auto-scroll to top when new activity arrives
      if (feedRef.current) {
        feedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      setVisibleActivities(activities);
    }
    prevActivitiesLength.current = activities.length;
  }, [activities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'reservation':
        return <MapPin className="h-4 w-4 text-blue-600" />;
      case 'launch':
        return <Zap className="h-4 w-4 text-green-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'reservation':
        return 'bg-blue-50 border-blue-200';
      case 'launch':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-purple-50 border-purple-200';
    }
  };

  return (
    <Card className="border-2 shadow-xl h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <CardTitle className="text-xl font-display">Live Activity</CardTitle>
        </div>
        <CardDescription>Real-time reservations and launches</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          ref={feedRef}
          className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-brand-blue-300 scrollbar-track-brand-blue-50"
        >
          {visibleActivities.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Waiting for activity...
              </p>
            </div>
          ) : (
            visibleActivities.map((activity, index) => (
              <div
                key={activity.id || index}
                className={`p-3 rounded-lg border transition-all hover:shadow-md ${getActivityColor(activity.type)} animate-slide-in-right`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'backwards'
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.city}, {activity.state}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.timestamp &&
                        formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true })
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {visibleActivities.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-brand-blue-600">
                  {visibleActivities.filter(a => a.type === 'reservation').length}
                </p>
                <p className="text-xs text-muted-foreground">Reservations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-green-600">
                  {visibleActivities.filter(a => a.type === 'launch').length}
                </p>
                <p className="text-xs text-muted-foreground">Launches</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: #eff6ff;
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #93c5fd;
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #60a5fa;
        }
      `}</style>
    </Card>
  );
}
