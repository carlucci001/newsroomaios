'use client';

import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { SetupProgress, getProgressPercentage } from '@/types/setupStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { Home } from 'lucide-react';

// Comprehensive category metadata for all 34 categories
const categoryMeta: Record<string, { icon: string; color: string; bgColor: string }> = {
  // Core News
  'local-news': { icon: '🏛️', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'breaking-news': { icon: '🚨', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  'politics': { icon: '🏛️', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  'crime': { icon: '🚔', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  // Business & Economy
  'business': { icon: '💼', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  'real-estate': { icon: '🏠', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  'jobs': { icon: '💼', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'agriculture': { icon: '🌾', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  // Sports & Recreation
  'sports': { icon: '🏈', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  'high-school-sports': { icon: '🏆', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  'college-sports': { icon: '🎓', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  'outdoors': { icon: '🏕️', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  // Lifestyle & Culture
  'entertainment': { icon: '🎭', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  'food-dining': { icon: '🍽️', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  'lifestyle': { icon: '✨', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  'faith': { icon: '⛪', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  'pets-animals': { icon: '🐾', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  // Community & People
  'community': { icon: '🤝', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  'obituaries': { icon: '🕯️', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  'events': { icon: '📅', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'seniors': { icon: '👴', color: 'text-teal-400', bgColor: 'bg-teal-500/20' },
  'veterans': { icon: '🎖️', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  // Education & Youth
  'education': { icon: '📚', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'youth': { icon: '👦', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  // Health & Environment
  'health': { icon: '🏥', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  'environment': { icon: '🌱', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  'weather': { icon: '🌤️', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  // Transportation & Infrastructure
  'transportation': { icon: '🚗', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'development': { icon: '🏗️', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  // Special Interest
  'technology': { icon: '💻', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'tourism': { icon: '✈️', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  'history': { icon: '📜', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  // Opinion & Editorial
  'opinion': { icon: '💭', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  'letters': { icon: '✉️', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
};

// Default metadata for any category not in the list
const defaultCategoryMeta = { icon: '📰', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };

const activityTemplates = [
  { action: 'Scanning RSS feeds', icon: '📡' },
  { action: 'Analyzing trending topics', icon: '📊' },
  { action: 'Cross-referencing sources', icon: '🔗' },
  { action: 'Generating headline', icon: '✍️' },
  { action: 'Writing article body', icon: '📝' },
  { action: 'Optimizing for SEO', icon: '🔍' },
  { action: 'Finding perfect image', icon: '🖼️' },
  { action: 'Fact-checking content', icon: '✓' },
  { action: 'Applying AP style', icon: '📰' },
  { action: 'Finalizing article', icon: '✨' },
];

interface ActivityItem {
  id: string;
  message: string;
  icon: string;
  category?: string;
  timestamp: Date;
  type: 'info' | 'success' | 'category';
}

interface Notification {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
}

interface StatusContentProps {
  tenantId: string;
  onBack?: () => void;
  adminCredentials?: { email: string; temporaryPassword: string } | null;
  newspaperUrl?: string | null;
}

export function StatusContent({ tenantId, onBack, adminCredentials, newspaperUrl }: StatusContentProps) {
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [tenantName, setTenantName] = useState<string>('Your Newspaper');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastArticleCount = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const newParticle = { id: Date.now(), x: Math.random() * 100, y: Math.random() * 100 };
      setParticles((prev) => [...prev.slice(-15), newParticle]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
      // Use actual user categories if available, otherwise fall back to generic
      const categories = progress?.categoryProgress
        ? Object.keys(progress.categoryProgress)
        : ['local-news', 'sports', 'business'];
      const randomCat = categories[Math.floor(Math.random() * categories.length)];
      const catName = progress?.categoryProgress?.[randomCat]?.name || randomCat.replace(/-/g, ' ');
      setActivities((prev) => {
        const newActivity: ActivityItem = {
          id: `${Date.now()}-${Math.random()}`,
          message: template.action,
          icon: template.icon,
          category: catName,
          timestamp: new Date(),
          type: 'info',
        };
        return [newActivity, ...prev].slice(0, 8);
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [progress]);

  useEffect(() => {
    if (!tenantId) return;
    const db = getDb();

    const unsubTenant = onSnapshot(doc(db, 'tenants', tenantId), (snapshot) => {
      if (snapshot.exists()) {
        setTenantName(snapshot.data().businessName || 'Your Newspaper');
      }
    });

    const unsubStatus = onSnapshot(doc(db, `tenants/${tenantId}/meta`, 'setupStatus'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const newProgress = {
          ...data,
          startedAt: data.startedAt?.toDate?.() || new Date(),
          lastUpdatedAt: data.lastUpdatedAt?.toDate?.() || new Date(),
        } as SetupProgress;

        if (newProgress.articlesGenerated > lastArticleCount.current) {
          const currentCategory = newProgress.currentCategory || 'Local News';
          const successActivity: ActivityItem = {
            id: `success-${Date.now()}`,
            message: `Article published for ${currentCategory}!`,
            icon: '🎉',
            category: currentCategory.toLowerCase().replace(' ', '-'),
            timestamp: new Date(),
            type: 'success' as const,
          };
          setActivities((prev) => [successActivity, ...prev].slice(0, 8));

          const catId = currentCategory.toLowerCase().replace(' ', '-');
          const catMeta = categoryMeta[catId] || { icon: '📰' };
          setNotifications((prev) => [...prev, {
            id: `notif-${Date.now()}`,
            title: `${currentCategory} article created!`,
            category: currentCategory,
            categoryIcon: catMeta.icon,
          }]);
          lastArticleCount.current = newProgress.articlesGenerated;
        }
        setProgress(newProgress);
      } else {
        setProgress({
          currentStep: 'account_created',
          completedSteps: ['account_created'],
          articlesGenerated: 0,
          totalArticles: 36,
          categoryProgress: {},
          startedAt: new Date(),
          lastUpdatedAt: new Date(),
          errors: [],
        });
      }
    });

    return () => { unsubTenant(); unsubStatus(); };
  }, [tenantId]);

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => setNotifications((prev) => prev.slice(1)), 4000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const percentComplete = progress ? getProgressPercentage(progress) : 0;
  const isComplete = progress?.currentStep === 'complete';

  return (
    <section className="relative py-16 md:py-24 min-h-screen bg-gradient-to-b from-brand-blue-50/30 to-background overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 bg-brand-blue-500/20 rounded-full pointer-events-none"
          initial={{ x: `${particle.x}%`, y: '100%', opacity: 0, scale: 0 }}
          animate={{ y: '-10%', opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 6, ease: 'linear' }}
        />
      ))}

      {/* Glowing Orbs */}
      <motion.div
        className="absolute top-10 left-10 w-48 h-48 bg-brand-blue-500/10 rounded-full blur-[80px] pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-40 h-40 bg-brand-blue-600/10 rounded-full blur-[60px] pointer-events-none"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Notification Toasts */}
      <div className="fixed top-24 right-4 z-50 space-y-3">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl px-5 py-4 shadow-2xl shadow-green-500/30 border border-green-400/30 flex items-center gap-3"
            >
              <span className="text-2xl">{notif.categoryIcon}</span>
              <div>
                <p className="font-bold text-white">{notif.title}</p>
                <p className="text-green-100/80 text-sm">Published successfully</p>
              </div>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white">✓</motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Back to Home */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        )}
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-blue-100 to-brand-blue-200 rounded-2xl mb-6 border border-brand-blue-200 shadow-lg shadow-brand-blue-500/10"
          >
            <span className="text-4xl">🗞️</span>
          </motion.div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            Building <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-600 to-brand-blue-500">{tenantName}</span>
          </h1>
          <p className="text-lg text-muted-foreground">{isComplete ? '🎉 Your newsroom is ready!' : 'AI Journalists are creating your content...'}</p>
        </motion.div>

        {/* Progress Section */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-card border-2 border-border rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold mb-1">Building Your Newspaper</h2>
              <p className="text-sm text-muted-foreground">AI journalists are creating content...</p>
            </div>
            <motion.div key={percentComplete} initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-600 to-brand-blue-500">
              {percentComplete}%
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="h-4 bg-muted rounded-full overflow-hidden mb-8 relative">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-blue-500 to-brand-blue-600 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              animate={{ x: ['-100%', '500%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-brand-blue-50 rounded-xl p-5 text-center border border-brand-blue-100">
              <motion.div key={progress?.articlesGenerated} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-display font-bold text-brand-blue-600 mb-1">
                {progress?.articlesGenerated || 0}
              </motion.div>
              <div className="text-sm text-muted-foreground font-medium">Articles Created</div>
            </div>
            <div className="bg-brand-blue-50 rounded-xl p-5 text-center border border-brand-blue-100">
              <div className="text-3xl font-display font-bold text-brand-blue-600 mb-1">{progress?.totalArticles || 36}</div>
              <div className="text-sm text-muted-foreground font-medium">Total Articles</div>
            </div>
            <div className="bg-brand-blue-50 rounded-xl p-5 text-center border border-brand-blue-100">
              <div className="text-3xl font-display font-bold text-brand-blue-600 mb-1">6</div>
              <div className="text-sm text-muted-foreground font-medium">AI Journalists</div>
            </div>
          </div>

          {/* Category Progress */}
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><span>📊</span> Category Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(progress?.categoryProgress || {}).map(([catId, catProgress], index) => {
              const meta = categoryMeta[catId] || defaultCategoryMeta;
              const generated = catProgress?.generated || 0;
              const total = catProgress?.total || 6;
              const status = catProgress?.status || 'pending';
              const percent = (generated / total) * 100;
              const displayName = catProgress?.name || catId.replace(/-/g, ' ');

              return (
                <motion.div
                  key={catId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative overflow-hidden rounded-xl p-4 border-2 transition-all ${
                    status === 'in_progress' ? 'bg-brand-blue-50 border-brand-blue-200' :
                    status === 'complete' ? 'bg-green-50 border-green-200' : 'bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{generated}/{total} articles</p>
                    </div>
                    {status === 'in_progress' && (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-brand-blue-500 border-t-transparent rounded-full" />
                    )}
                    {status === 'complete' && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</motion.div>
                    )}
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div className={`h-full rounded-full ${status === 'complete' ? 'bg-green-500' : 'bg-gradient-to-r from-brand-blue-500 to-brand-blue-600'}`} initial={{ width: 0 }} animate={{ width: `${percent}%` }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-card border-2 border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
            </div>
            <h3 className="font-semibold">Live Activity</h3>
          </div>
          <div className="space-y-3 max-h-40 overflow-y-auto font-mono text-sm">
            <AnimatePresence>
              {activities.slice(0, 5).map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-2 ${activity.type === 'success' ? 'text-green-600 font-semibold' : 'text-muted-foreground'}`}
                >
                  <span>{activity.icon}</span>
                  <span>{activity.message}</span>
                  {activity.category && <span className="text-muted-foreground/60">({activity.category})</span>}
                </motion.div>
              ))}
            </AnimatePresence>
            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="inline-block w-2 h-4 bg-brand-blue-500" />
          </div>
        </motion.div>

        {/* Admin Credentials - shown immediately so customer has them */}
        {adminCredentials && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔑</span>
                <h3 className="font-display font-bold text-lg text-amber-900">Your Admin Login</h3>
              </div>
              <div className="bg-white rounded-xl p-5 space-y-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-semibold">{adminCredentials.email}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(adminCredentials.email)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Password</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold text-amber-700">{adminCredentials.temporaryPassword}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(adminCredentials.temporaryPassword)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-amber-700 mt-3">Change your password immediately after logging in.</p>
            </div>
          </motion.div>
        )}

        {/* Complete State */}
        {isComplete && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-display font-bold text-green-800 mb-2">Your Newspaper is Ready!</h2>
              <p className="text-green-700 mb-6">Your site is live and ready for the world to see.</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <motion.a
                  href={progress?.siteUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-brand-blue-500 to-brand-blue-600 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-xl shadow-brand-blue-500/30 hover:shadow-brand-blue-500/40 transition-shadow"
                >
                  <span>View Your Newspaper</span>
                  <span>🚀</span>
                </motion.a>
                <motion.a
                  href={`${progress?.siteUrl || ''}/backend`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center gap-3 bg-white border-2 border-brand-blue-200 text-brand-blue-600 font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:bg-brand-blue-50 transition-colors"
                >
                  <span>Open Admin Panel</span>
                  <span>⚙️</span>
                </motion.a>
              </div>

              <div className="bg-white/50 rounded-xl p-4 text-left max-w-md mx-auto">
                <p className="text-sm font-semibold text-gray-700 mb-2">Your Site URL:</p>
                <code className="block bg-gray-100 rounded px-3 py-2 text-sm text-gray-800 mb-3 break-all">
                  {progress?.siteUrl || 'Loading...'}
                </code>
                <p className="text-xs text-gray-500">
                  Tip: Configure your DNS to use your custom domain. Until then, use the Vercel URL above.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
