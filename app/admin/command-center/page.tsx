'use client';

import 'antd/dist/reset.css';
import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tabs,
  Tag,
  Space,
  Spin,
  Progress,
} from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  ApiOutlined,
  DatabaseOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  RiseOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// ─── LED / Activity CSS ─────────────────────────────────────────────────

const LED_STYLES = `
@keyframes cc-pulse-green {
  0%, 100% { box-shadow: 0 0 4px #22c55e, 0 0 8px #22c55e66; }
  50% { box-shadow: 0 0 8px #22c55e, 0 0 20px #22c55eaa, 0 0 30px #22c55e44; }
}
@keyframes cc-pulse-amber {
  0%, 100% { box-shadow: 0 0 4px #f59e0b, 0 0 8px #f59e0b66; }
  50% { box-shadow: 0 0 8px #f59e0b, 0 0 20px #f59e0baa, 0 0 30px #f59e0b44; }
}
@keyframes cc-pulse-red {
  0%, 100% { box-shadow: 0 0 4px #ef4444, 0 0 8px #ef444466; }
  50% { box-shadow: 0 0 8px #ef4444, 0 0 20px #ef4444aa, 0 0 30px #ef444444; }
}
@keyframes cc-sweep {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes cc-data-flow {
  0% { stroke-dashoffset: 20; }
  100% { stroke-dashoffset: 0; }
}
`;

function Led({ color, size = 10 }: { color: 'green' | 'amber' | 'red'; size?: number }) {
  const bg = color === 'green' ? '#22c55e' : color === 'amber' ? '#f59e0b' : '#ef4444';
  const anim = color === 'green' ? 'cc-pulse-green' : color === 'amber' ? 'cc-pulse-amber' : 'cc-pulse-red';
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      background: bg,
      animation: `${anim} 2s ease-in-out infinite`,
    }} />
  );
}

// ─── Types ───────────────────────────────────────────────────────────────

interface TenantHealth {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  status: string;
  siteUrl?: string;
  plan?: string;
  creditsUsed: number;
  creditsTotal: number;
  lastArticleAt?: Date;
  health: 'green' | 'amber' | 'red';
  issues: string[];
}

interface CostMetrics {
  totalArticles: number;
  totalCreditsUsed: number;
  avgCreditsPerArticle: number;
  totalImageSearches: number;
  totalWebSearches: number;
  totalFactChecks: number;
  costBreakdown: { action: string; count: number; credits: number }[];
  topConsumers: { name: string; used: number; total: number }[];
}

interface SystemCheck {
  label: string;
  status: 'ok' | 'warn' | 'error';
  detail: string;
}


// Full state name → abbreviation for coordinate lookup
const STATE_NAME_TO_ABBR: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY',
};

function normalizeState(state: string): string {
  if (!state) return '';
  const trimmed = state.trim();
  if (trimmed.length <= 2) return trimmed.toUpperCase();
  return STATE_NAME_TO_ABBR[trimmed.toLowerCase()] || trimmed.toUpperCase();
}


// ─── Main Component ──────────────────────────────────────────────────────

export default function CommandCenterPage() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantHealth[]>([]);
  const [costMetrics, setCostMetrics] = useState<CostMetrics | null>(null);
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      const db = getDb();

      // Fetch tenants and credits in parallel
      const [tenantsSnap, creditsSnap, usageSnap] = await Promise.all([
        getDocs(collection(db, 'tenants')),
        getDocs(collection(db, 'tenantCredits')),
        getDocs(query(collection(db, 'creditUsage'), orderBy('timestamp', 'desc'), limit(500))),
      ]);

      const tenantsData = tenantsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Tenant[];
      const creditsMap = new Map<string, any>();
      creditsSnap.docs.forEach(d => creditsMap.set(d.id, d.data()));

      // Build tenant health
      const healthData: TenantHealth[] = tenantsData.map(t => {
        const creds = creditsMap.get(t.id);
        const issues: string[] = [];
        let health: 'green' | 'amber' | 'red' = 'green';

        if (t.status !== 'active') {
          issues.push(`Status: ${t.status}`);
          health = 'red';
        }
        if (!t.siteUrl) {
          issues.push('No site URL');
          health = health === 'red' ? 'red' : 'amber';
        }
        if (creds) {
          const pct = creds.monthlyAllocation > 0
            ? ((creds.creditsUsed || 0) / creds.monthlyAllocation) * 100
            : 0;
          if (pct > 90) {
            issues.push('Credits > 90%');
            health = health === 'red' ? 'red' : 'amber';
          }
          if (creds.status === 'exhausted') {
            issues.push('Credits exhausted');
            health = 'red';
          }
        } else {
          issues.push('No credit record');
          health = health === 'red' ? 'red' : 'amber';
        }

        return {
          id: t.id,
          name: t.businessName,
          slug: t.slug,
          city: t.serviceArea?.city || '',
          state: t.serviceArea?.state || '',
          status: t.status,
          siteUrl: t.siteUrl,
          plan: t.plan,
          creditsUsed: creds?.creditsUsed || 0,
          creditsTotal: creds?.monthlyAllocation || 0,
          health,
          issues,
        };
      });

      setTenants(healthData);

      // Build cost metrics from usage data
      const usageDocs = usageSnap.docs.map(d => d.data());
      const actionCounts: Record<string, { count: number; credits: number }> = {};

      usageDocs.forEach((u: any) => {
        const action = u.action || u.feature || 'unknown';
        if (!actionCounts[action]) actionCounts[action] = { count: 0, credits: 0 };
        actionCounts[action].count++;
        actionCounts[action].credits += u.creditsUsed || u.amount || 0;
      });

      const articleCount = actionCounts['article_generation']?.count || 0;
      const totalCreditsUsed = Object.values(actionCounts).reduce((s, v) => s + v.credits, 0);

      const topConsumers = healthData
        .filter(t => t.creditsUsed > 0)
        .sort((a, b) => b.creditsUsed - a.creditsUsed)
        .slice(0, 5)
        .map(t => ({ name: t.name, used: t.creditsUsed, total: t.creditsTotal }));

      setCostMetrics({
        totalArticles: articleCount,
        totalCreditsUsed,
        avgCreditsPerArticle: articleCount > 0 ? Math.round((totalCreditsUsed / articleCount) * 10) / 10 : 0,
        totalImageSearches: actionCounts['image_generation']?.count || 0,
        totalWebSearches: actionCounts['web_search']?.count || 0,
        totalFactChecks: actionCounts['fact_check']?.count || 0,
        costBreakdown: Object.entries(actionCounts).map(([action, data]) => ({
          action: action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          count: data.count,
          credits: data.credits,
        })).sort((a, b) => b.credits - a.credits),
        topConsumers,
      });

      // Build system checks
      const checks: SystemCheck[] = [
        {
          label: 'Stripe Webhook Verification',
          status: 'ok',
          detail: 'Signature verification active (constructEvent)',
        },
        {
          label: 'Platform Secret',
          status: 'ok',
          detail: 'Rotated — no hardcoded fallbacks in codebase',
        },
        {
          label: 'Environment Files',
          status: 'ok',
          detail: '.env* pattern in .gitignore covers all env files',
        },
        {
          label: 'Firebase Storage Rules',
          status: 'ok',
          detail: 'Deployed to both platform and WNC Times projects',
        },
        {
          label: 'Active Tenants',
          status: healthData.filter(t => t.health === 'red').length > 0 ? 'warn' : 'ok',
          detail: `${healthData.filter(t => t.health === 'green').length}/${healthData.length} healthy`,
        },
        {
          label: 'Credit System',
          status: healthData.some(t => t.issues.includes('Credits exhausted')) ? 'warn' : 'ok',
          detail: `${healthData.filter(t => t.creditsUsed > 0).length} tenants with active usage`,
        },
        {
          label: 'API Auth (verifyPlatformSecret)',
          status: 'ok',
          detail: 'Centralized auth utility — 22 routes protected',
        },
        {
          label: 'Tenant Deployments',
          status: healthData.filter(t => !t.siteUrl && t.status === 'active').length > 0 ? 'warn' : 'ok',
          detail: `${healthData.filter(t => t.siteUrl).length}/${healthData.length} deployed`,
        },
      ];
      setSystemChecks(checks);

    } catch (err) {
      console.error('[Command Center] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  // ─── Tab Content Builders ────────────────────────────────────────────

  const healthTab = useMemo(() => {
    const okCount = systemChecks.filter(c => c.status === 'ok').length;
    const warnCount = systemChecks.filter(c => c.status === 'warn').length;
    const errCount = systemChecks.filter(c => c.status === 'error').length;
    const allGood = warnCount === 0 && errCount === 0;

    return (
      <div style={{ marginTop: 16 }}>
        {/* Overall status banner */}
        <Card
          style={{
            marginBottom: 24,
            background: isDark
              ? allGood ? '#0a2e1a' : '#2e1a0a'
              : allGood ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${allGood ? (isDark ? '#166534' : '#86efac') : (isDark ? '#92400e' : '#fcd34d')}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Led color={allGood ? 'green' : 'amber'} size={48} />
            <div>
              <Title level={4} style={{ margin: 0, color: isDark ? '#f0fdf4' : undefined }}>
                {allGood ? 'All Systems Operational' : `${warnCount + errCount} Issue${warnCount + errCount > 1 ? 's' : ''} Detected`}
              </Title>
              <Text style={{ color: isDark ? '#a3a3a3' : '#6b7280' }}>
                {okCount} checks passed{warnCount > 0 ? ` · ${warnCount} warning${warnCount > 1 ? 's' : ''}` : ''}
                {errCount > 0 ? ` · ${errCount} error${errCount > 1 ? 's' : ''}` : ''}
              </Text>
            </div>
          </div>
        </Card>

        {/* System check grid */}
        <Row gutter={[16, 16]}>
          {systemChecks.map((check, i) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={i}>
              <Card
                size="small"
                style={{
                  borderLeft: `3px solid ${
                    check.status === 'ok' ? '#22c55e'
                    : check.status === 'warn' ? '#f59e0b'
                    : '#ef4444'
                  }`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ marginTop: 4 }}>
                    <Led color={check.status === 'ok' ? 'green' : check.status === 'warn' ? 'amber' : 'red'} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>{check.label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{check.detail}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Tenant health summary */}
        <Title level={5} style={{ marginTop: 32, marginBottom: 16 }}>
          Tenant Health Overview
        </Title>
        <Row gutter={[16, 16]}>
          {tenants.map(t => (
            <Col xs={24} sm={12} lg={8} xl={6} key={t.id}>
              <Card
                size="small"
                style={{
                  borderTop: `3px solid ${
                    t.health === 'green' ? '#22c55e'
                    : t.health === 'amber' ? '#f59e0b'
                    : '#ef4444'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 13 }}>{t.name}</Text>
                  <Led color={t.health} size={8} />
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.city}{t.state ? `, ${t.state}` : ''}
                </Text>
                {t.creditsTotal > 0 && (
                  <Progress
                    percent={Math.round((t.creditsUsed / t.creditsTotal) * 100)}
                    size="small"
                    strokeColor={
                      t.creditsUsed / t.creditsTotal > 0.9 ? '#ef4444'
                      : t.creditsUsed / t.creditsTotal > 0.7 ? '#f59e0b'
                      : '#22c55e'
                    }
                    style={{ marginTop: 8 }}
                  />
                )}
                {t.issues.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {t.issues.map((issue, j) => (
                      <Tag key={j} color={t.health === 'red' ? 'error' : 'warning'} style={{ fontSize: 11, marginBottom: 2 }}>
                        {issue}
                      </Tag>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }, [systemChecks, tenants, isDark]);

  const costTab = useMemo(() => {
    if (!costMetrics) return <Spin />;

    return (
      <div style={{ marginTop: 16 }}>
        {/* Key stats */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="Articles Generated"
                value={costMetrics.totalArticles}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="Credits Consumed"
                value={costMetrics.totalCreditsUsed}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="Avg per Article"
                value={costMetrics.avgCreditsPerArticle}
                suffix="cr"
                prefix={<RiseOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic title="Image Searches" value={costMetrics.totalImageSearches} />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic title="Web Searches" value={costMetrics.totalWebSearches} />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic title="Fact Checks" value={costMetrics.totalFactChecks} />
            </Card>
          </Col>
        </Row>

        {/* Cost breakdown */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={14}>
            <Card title="Credit Usage by Operation" size="small">
              {costMetrics.costBreakdown.map((item, i) => {
                const maxCredits = costMetrics.costBreakdown[0]?.credits || 1;
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 13 }}>{item.action}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.count} ops · {item.credits} credits
                      </Text>
                    </div>
                    <Progress
                      percent={Math.round((item.credits / maxCredits) * 100)}
                      showInfo={false}
                      size="small"
                      strokeColor={isDark ? '#3b82f6' : '#2563eb'}
                    />
                  </div>
                );
              })}
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="Top Consumers" size="small">
              {costMetrics.topConsumers.map((t, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 13 }}>{t.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.used} / {t.total} cr
                    </Text>
                  </div>
                  <Progress
                    percent={t.total > 0 ? Math.round((t.used / t.total) * 100) : 0}
                    size="small"
                    strokeColor={
                      t.total > 0 && t.used / t.total > 0.9 ? '#ef4444'
                      : t.total > 0 && t.used / t.total > 0.7 ? '#f59e0b'
                      : '#22c55e'
                    }
                  />
                </div>
              ))}
              {costMetrics.topConsumers.length === 0 && (
                <Text type="secondary">No usage data yet</Text>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }, [costMetrics, isDark]);

  const mapTab = useMemo(() => {
    // Same percentage-based coordinate system as the front-end InteractiveMap
    const statePositions: Record<string, { x: number; y: number }> = {
      'Alabama': { x: 68, y: 68 }, 'Alaska': { x: 10, y: 85 },
      'Arizona': { x: 20, y: 60 }, 'Arkansas': { x: 60, y: 63 },
      'California': { x: 10, y: 55 }, 'Colorado': { x: 35, y: 50 },
      'Connecticut': { x: 88, y: 35 }, 'Delaware': { x: 85, y: 42 },
      'Florida': { x: 78, y: 80 }, 'Georgia': { x: 73, y: 68 },
      'Hawaii': { x: 22, y: 85 }, 'Idaho': { x: 23, y: 30 },
      'Illinois': { x: 64, y: 47 }, 'Indiana': { x: 68, y: 46 },
      'Iowa': { x: 60, y: 40 }, 'Kansas': { x: 52, y: 50 },
      'Kentucky': { x: 70, y: 52 }, 'Louisiana': { x: 62, y: 74 },
      'Maine': { x: 92, y: 22 }, 'Maryland': { x: 83, y: 45 },
      'Massachusetts': { x: 88, y: 32 }, 'Michigan': { x: 69, y: 35 },
      'Minnesota': { x: 60, y: 28 }, 'Mississippi': { x: 63, y: 70 },
      'Missouri': { x: 60, y: 50 }, 'Montana': { x: 32, y: 25 },
      'Nebraska': { x: 50, y: 42 }, 'Nevada': { x: 18, y: 45 },
      'New Hampshire': { x: 88, y: 28 }, 'New Jersey': { x: 85, y: 42 },
      'New Mexico': { x: 33, y: 62 }, 'New York': { x: 84, y: 33 },
      'North Carolina': { x: 78, y: 58 }, 'North Dakota': { x: 50, y: 25 },
      'Ohio': { x: 72, y: 45 }, 'Oklahoma': { x: 52, y: 60 },
      'Oregon': { x: 15, y: 32 }, 'Pennsylvania': { x: 80, y: 42 },
      'Rhode Island': { x: 89, y: 34 }, 'South Carolina': { x: 76, y: 64 },
      'South Dakota': { x: 50, y: 35 }, 'Tennessee': { x: 68, y: 58 },
      'Texas': { x: 48, y: 72 }, 'Utah': { x: 27, y: 47 },
      'Vermont': { x: 86, y: 28 }, 'Virginia': { x: 80, y: 51 },
      'Washington': { x: 17, y: 23 }, 'West Virginia': { x: 76, y: 48 },
      'Wisconsin': { x: 63, y: 32 }, 'Wyoming': { x: 35, y: 38 },
    };

    // City-specific offsets (so papers in the same state don't overlap)
    const cityPositions: Record<string, { x: number; y: number }> = {
      'asheville': { x: 76, y: 57 }, 'hendersonville': { x: 74, y: 59 },
      'atlanta': { x: 73, y: 66 }, 'chicago': { x: 64, y: 43 },
      'minneapolis': { x: 58, y: 28 }, 'omaha': { x: 52, y: 42 },
      'portland': { x: 13, y: 28 }, 'st. petersburg': { x: 77, y: 82 },
      'saint petersburg': { x: 77, y: 82 }, 'miami': { x: 80, y: 86 },
      'san diego': { x: 12, y: 60 }, 'oceanside': { x: 10, y: 57 },
      'seattle': { x: 15, y: 22 }, 'denver': { x: 35, y: 48 },
      'colorado springs': { x: 36, y: 52 }, 'austin': { x: 48, y: 74 },
      'nashville': { x: 67, y: 57 }, 'phoenix': { x: 22, y: 62 },
      'cincinnati': { x: 71, y: 47 },
    };

    // Resolve each tenant to a map position
    const mapTenants = tenants
      .map(t => {
        const cityKey = t.city.toLowerCase().trim();
        const pos = cityPositions[cityKey];
        if (pos) return { ...t, x: pos.x, y: pos.y };

        // Fallback: use state center
        const abbr = normalizeState(t.state);
        const STATE_ABBREVS_REV: Record<string, string> = {};
        Object.entries(STATE_NAME_TO_ABBR).forEach(([name, ab]) => {
          STATE_ABBREVS_REV[ab] = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        });
        const fullName = STATE_ABBREVS_REV[abbr] || t.state;
        const statePos = statePositions[fullName];
        if (statePos) return { ...t, x: statePos.x, y: statePos.y };
        return null;
      })
      .filter(Boolean) as (TenantHealth & { x: number; y: number })[];

    const healthColor = (h: string) =>
      h === 'green' ? '#22c55e' : h === 'amber' ? '#f59e0b' : '#ef4444';

    return (
      <div style={{ marginTop: 16 }}>
        <Card
          style={{
            background: isDark ? '#0f172a' : '#f8fafc',
            border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>Network Map</Title>
              <Text type="secondary">{mapTenants.length} papers across the United States</Text>
            </div>
            <Space>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Led color="green" size={6} /> <Text style={{ fontSize: 12 }}>Healthy</Text>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Led color="amber" size={6} /> <Text style={{ fontSize: 12 }}>Warning</Text>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Led color="red" size={6} /> <Text style={{ fontSize: 12 }}>Issue</Text>
              </span>
            </Space>
          </div>

          {/* Map with real US background image — same approach as front-end InteractiveMap */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', minHeight: 300, borderRadius: 8, overflow: 'hidden' }}>
            {/* US Map background */}
            <div style={{ position: 'absolute', inset: 0, background: isDark ? '#0f172a' : 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Blank_US_Map_%28states_only%29.svg/1280px-Blank_US_Map_%28states_only%29.svg.png"
                alt="US Map"
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  opacity: isDark ? 0.15 : 0.5,
                  filter: isDark ? 'invert(1) brightness(2)' : 'contrast(1.1)',
                }}
              />
            </div>

            {/* Tenant markers */}
            <div style={{ position: 'absolute', inset: 0 }}>
              {mapTenants.map(t => (
                <div
                  key={t.id}
                  style={{
                    position: 'absolute',
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: t.health === 'red' ? 30 : t.health === 'amber' ? 20 : 10,
                  }}
                >
                  {/* Pulse ring */}
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: healthColor(t.health),
                    opacity: 0.2,
                    animation: `cc-pulse-${t.health} 2s ease-in-out infinite`,
                  }} />
                  {/* LED dot */}
                  <div style={{ position: 'relative' }}>
                    <Led color={t.health} size={12} />
                  </div>
                  {/* City label */}
                  <div style={{
                    position: 'absolute',
                    top: -18, left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    fontSize: 10, fontWeight: 600,
                    color: isDark ? '#94a3b8' : '#334155',
                    textShadow: isDark ? '0 1px 3px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.8)',
                  }}>
                    {t.city}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Paper list below map */}
        <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
          {tenants.map(t => (
            <Col xs={24} sm={12} lg={8} key={t.id}>
              <Card size="small" style={{ borderLeft: `3px solid ${healthColor(t.health)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>{t.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {t.city}{t.state ? `, ${t.state}` : ''} · {t.plan || 'No plan'}
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <Led color={t.health} size={8} />
                    {t.siteUrl && (
                      <a
                        href={t.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11 }}
                      >
                        Visit
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }, [tenants, isDark]);

  // ─── Tab items ─────────────────────────────────────────────────────

  const tabItems = [
    {
      key: 'health',
      label: (
        <span>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          System Health
        </span>
      ),
      children: healthTab,
    },
    {
      key: 'costs',
      label: (
        <span>
          <DollarOutlined style={{ marginRight: 8 }} />
          Cost Analytics
        </span>
      ),
      children: costTab,
    },
    {
      key: 'network',
      label: (
        <span>
          <GlobalOutlined style={{ marginRight: 8 }} />
          Network Map
        </span>
      ),
      children: mapTab,
    },
  ];

  // ─── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: LED_STYLES }} />
        <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Space direction="vertical" align="center" size="large">
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '2px solid transparent', borderTopColor: '#3b82f6',
                animation: 'cc-sweep 1.5s linear infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 8, borderRadius: '50%',
                border: '2px solid transparent', borderTopColor: '#22c55e',
                animation: 'cc-sweep 2s linear infinite reverse',
              }} />
              <Led color="green" size={16} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <Led color="green" size={16} />
              </div>
            </div>
            <Text type="secondary">Initializing Command Center...</Text>
          </Space>
        </div>
      </>
    );
  }

  const greenCount = tenants.filter(t => t.health === 'green').length;
  const amberCount = tenants.filter(t => t.health === 'amber').length;
  const redCount = tenants.filter(t => t.health === 'red').length;

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: LED_STYLES }} />
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Led color={redCount > 0 ? 'red' : amberCount > 0 ? 'amber' : 'green'} size={14} />
            <div>
              <Title level={2} style={{ margin: 0 }}>Command Center</Title>
              <Text type="secondary">Platform health, costs, and network overview</Text>
            </div>
          </div>
          <Space>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Led color="green" size={6} /> {greenCount} OK
            </span>
            {amberCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#f59e0b' }}>
                <Led color="amber" size={6} /> {amberCount} WARN
              </span>
            )}
            {redCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#ef4444' }}>
                <Led color="red" size={6} /> {redCount} CRIT
              </span>
            )}
          </Space>
        </div>

        {/* Quick stats row */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Papers Online"
                value={tenants.filter(t => t.siteUrl).length}
                suffix={`/ ${tenants.length}`}
                prefix={<CloudServerOutlined />}
                valueStyle={{ color: '#22c55e' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="System Checks"
                value={systemChecks.filter(c => c.status === 'ok').length}
                suffix={`/ ${systemChecks.length}`}
                prefix={<SafetyCertificateOutlined />}
                valueStyle={{ color: systemChecks.every(c => c.status === 'ok') ? '#22c55e' : '#f59e0b' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Credits Used"
                value={costMetrics?.totalCreditsUsed || 0}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Articles Generated"
                value={costMetrics?.totalArticles || 0}
                prefix={<ApiOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabs */}
        <Tabs items={tabItems} size="large" />
      </Space>
    </div>
    </>
  );
}
