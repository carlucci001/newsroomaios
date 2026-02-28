'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Users, ArrowRight, Linkedin, Sparkles, Shield, Cpu, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TeamMember {
  id: string;
  name: string;
  title: string;
  department: string;
  bio: string;
  photoURL: string;
  linkedIn?: string;
  displayOrder: number;
}

interface TeamPageSettings {
  isPublic: boolean;
  pageTitle: string;
  pageSubtitle: string;
}

const DEPT_ACCENT: Record<string, { badge: string; border: string; glow: string }> = {
  Leadership: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
    border: 'group-hover:border-amber-300',
    glow: 'group-hover:shadow-amber-100/50',
  },
  Engineering: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200/60',
    border: 'group-hover:border-blue-300',
    glow: 'group-hover:shadow-blue-100/50',
  },
  Design: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200/60',
    border: 'group-hover:border-purple-300',
    glow: 'group-hover:shadow-purple-100/50',
  },
  Content: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    border: 'group-hover:border-emerald-300',
    glow: 'group-hover:shadow-emerald-100/50',
  },
  Operations: {
    badge: 'bg-orange-50 text-orange-700 border-orange-200/60',
    border: 'group-hover:border-orange-300',
    glow: 'group-hover:shadow-orange-100/50',
  },
};

const getDeptStyle = (dept: string) => DEPT_ACCENT[dept] || {
  badge: 'bg-gray-50 text-gray-700 border-gray-200/60',
  border: 'group-hover:border-gray-300',
  glow: 'group-hover:shadow-gray-100/50',
};

export default function TeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [settings, setSettings] = useState<TeamPageSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const db = getDb();

        const settingsSnap = await getDoc(doc(db, 'settings', 'team'));
        if (!settingsSnap.exists() || !settingsSnap.data()?.isPublic) {
          router.replace('/');
          return;
        }
        setSettings(settingsSnap.data() as TeamPageSettings);

        const q = query(
          collection(db, 'teamMembers'),
          where('isVisible', '==', true),
          orderBy('displayOrder', 'asc')
        );
        const snap = await getDocs(q);
        setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as TeamMember[]);
      } catch (error) {
        console.error('Failed to load team data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  if (!settings?.isPublic) {
    return null;
  }

  const leadership = members.filter(m => m.department === 'Leadership');
  const team = members.filter(m => m.department !== 'Leadership');

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero — gradient background with decorative elements */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        {/* Decorative shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-blue-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-20 right-0 w-80 h-80 bg-amber-100/20 rounded-full blur-3xl translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-[600px] h-40 bg-gradient-to-r from-brand-blue-50/0 via-brand-blue-50/30 to-brand-blue-50/0 blur-2xl -translate-x-1/2" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-brand-blue-200/60 bg-white/80 backdrop-blur-sm shadow-sm mb-8">
              <Users className="h-4 w-4 text-brand-blue-600" />
              <span className="text-sm font-semibold text-brand-blue-700">
                Our Team
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.08]">
              {settings.pageTitle || 'Meet Our Team'}
            </h1>
            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
              {settings.pageSubtitle || 'The people behind Newsroom AIOS — building the future of AI-powered local journalism.'}
            </p>
          </div>

          {/* Stats strip */}
          <div className="mt-14 flex flex-wrap justify-center gap-8 md:gap-14">
            {[
              { icon: Cpu, label: 'AI-Powered Platform', value: 'Full Stack' },
              { icon: Newspaper, label: 'Papers Served', value: '17+' },
              { icon: Shield, label: 'Uptime SLA', value: '99.9%' },
              { icon: Sparkles, label: 'Articles Generated', value: '10,000+' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-blue-50 mb-2">
                  <Icon className="h-5 w-5 text-brand-blue-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      {leadership.length > 0 && (
        <section className="relative py-16 md:py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Leadership
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full mx-auto" />
            </div>

            <div className={`grid gap-8 ${leadership.length === 1 ? 'max-w-md mx-auto' : 'md:grid-cols-2 max-w-3xl mx-auto'}`}>
              {leadership.map((member) => {
                const style = getDeptStyle(member.department);
                return (
                  <div
                    key={member.id}
                    className={`group relative bg-white rounded-2xl border border-slate-200/80 shadow-md hover:shadow-xl ${style.glow} transition-all duration-300`}
                  >
                    {/* Top gradient accent */}
                    <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400" />

                    <div className="p-8 md:p-10 text-center">
                      <div className="relative mx-auto mb-6 w-36 h-36">
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt={member.name}
                            className="w-36 h-36 rounded-full object-cover border-4 border-amber-100 group-hover:border-amber-300 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="w-36 h-36 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center border-4 border-amber-100 shadow-lg">
                            <span className="text-4xl font-bold text-white">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        )}
                      </div>

                      <h3 className="font-display text-2xl font-bold text-slate-900 mb-1">
                        {member.name}
                      </h3>
                      <p className="text-base font-semibold text-amber-600 mb-4">
                        {member.title}
                      </p>
                      <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                        {member.bio}
                      </p>

                      {member.linkedIn && (
                        <a
                          href={member.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-5 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                          <span>Connect on LinkedIn</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Team Grid */}
      {team.length > 0 && (
        <section className="relative py-16 md:py-20 bg-gradient-to-b from-slate-50/50 to-white">
          {/* Subtle decorative dots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                The Team
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-brand-blue-400 to-brand-blue-600 rounded-full mx-auto" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {team.map((member) => {
                const style = getDeptStyle(member.department);
                return (
                  <div
                    key={member.id}
                    className={`group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg ${style.glow} ${style.border} transition-all duration-300 hover:-translate-y-1`}
                  >
                    <div className="p-6 text-center">
                      {/* Photo with hover zoom */}
                      <div className="relative mx-auto mb-4 w-24 h-24 overflow-hidden rounded-full">
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt={member.name}
                            className="w-24 h-24 rounded-full object-cover border-3 border-slate-100 group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-blue-500 to-brand-blue-700 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        )}
                      </div>

                      <h3 className="font-display text-lg font-bold text-slate-900 mb-0.5">
                        {member.name}
                      </h3>
                      <p className="text-sm font-medium text-brand-blue-600 mb-3">
                        {member.title}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold border ${style.badge}`}>
                        {member.department}
                      </span>

                      <p className="mt-4 text-[13px] text-slate-500 leading-relaxed">
                        {member.bio}
                      </p>

                      {member.linkedIn && (
                        <a
                          href={member.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-4 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                          <span>Connect</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA — gradient background */}
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-600 via-brand-blue-700 to-brand-blue-800" />
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to Launch Your Paper?
          </h2>
          <p className="text-lg text-blue-100/90 mb-10 max-w-2xl mx-auto">
            Join the growing network of AI-powered local newspapers. Our team is here to help you every step of the way.
          </p>
          <Link href="/?view=leadCapture">
            <Button size="lg" className="rounded-full px-10 py-6 text-base font-semibold bg-white text-brand-blue-700 hover:bg-blue-50 shadow-xl shadow-brand-blue-900/30 hover:shadow-2xl hover:scale-[1.03] transition-all duration-200 active:scale-95">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
