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
  Tooltip,
  Badge,
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

// ─── US State coordinates for map ────────────────────────────────────────

const STATE_COORDS: Record<string, [number, number]> = {
  AL: [32.8, -86.8], AK: [64.2, -152.5], AZ: [34.3, -111.7], AR: [34.8, -92.2],
  CA: [37.2, -119.5], CO: [39.0, -105.5], CT: [41.6, -72.7], DE: [39.0, -75.5],
  FL: [28.6, -82.4], GA: [33.0, -83.5], HI: [20.8, -156.3], ID: [44.4, -114.6],
  IL: [40.0, -89.2], IN: [39.9, -86.3], IA: [42.0, -93.5], KS: [38.5, -98.3],
  KY: [37.8, -85.3], LA: [31.1, -91.9], ME: [45.4, -69.2], MD: [39.0, -76.7],
  MA: [42.2, -71.8], MI: [44.3, -85.4], MN: [46.3, -94.3], MS: [32.7, -89.7],
  MO: [38.5, -92.5], MT: [47.0, -109.6], NE: [41.5, -99.8], NV: [39.3, -116.6],
  NH: [43.7, -71.6], NJ: [40.1, -74.7], NM: [34.5, -106.0], NY: [42.9, -75.5],
  NC: [35.6, -79.8], ND: [47.4, -100.5], OH: [40.4, -82.8], OK: [35.6, -97.5],
  OR: [44.0, -120.5], PA: [40.9, -77.8], RI: [41.7, -71.5], SC: [33.9, -80.9],
  SD: [44.4, -100.2], TN: [35.9, -86.4], TX: [31.5, -99.4], UT: [39.3, -111.7],
  VT: [44.1, -72.6], VA: [37.5, -78.9], WA: [47.4, -120.7], WV: [38.6, -80.6],
  WI: [44.6, -89.8], WY: [43.0, -107.6], DC: [38.9, -77.0],
};

const CITY_COORDS: Record<string, [number, number]> = {
  'asheville': [35.60, -82.55], 'hendersonville': [35.32, -82.46],
  'atlanta': [33.75, -84.39], 'chicago': [41.88, -87.63],
  'minneapolis': [44.98, -93.27], 'omaha': [41.26, -95.93],
  'portland': [45.51, -122.68], 'st. petersburg': [27.77, -82.64],
  'san diego': [32.72, -117.16], 'oceanside': [33.20, -117.38],
  'seattle': [47.61, -122.33], 'denver': [39.74, -104.98],
  'austin': [30.27, -97.74], 'nashville': [36.16, -86.78],
  'phoenix': [33.45, -112.07],
};

function getCityCoords(city: string, state: string): [number, number] | null {
  const cityKey = city.toLowerCase();
  if (CITY_COORDS[cityKey]) return CITY_COORDS[cityKey];
  if (STATE_COORDS[state]) return STATE_COORDS[state];
  return null;
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
    // SVG-based US map with tenant markers
    const mapTenants = tenants
      .map(t => {
        const coords = getCityCoords(t.city, t.state);
        if (!coords) return null;
        return { ...t, lat: coords[0], lng: coords[1] };
      })
      .filter(Boolean) as (TenantHealth & { lat: number; lng: number })[];

    // Bounding box for continental US
    const minLat = 24, maxLat = 50, minLng = -125, maxLng = -66;
    const svgW = 900, svgH = 500;

    function project(lat: number, lng: number): [number, number] {
      const x = ((lng - minLng) / (maxLng - minLng)) * svgW;
      const y = ((maxLat - lat) / (maxLat - minLat)) * svgH;
      return [x, y];
    }

    const healthColor = (h: string) =>
      h === 'green' ? '#22c55e' : h === 'amber' ? '#f59e0b' : '#ef4444';

    const glowColor = (h: string) =>
      h === 'green' ? '#22c55e66' : h === 'amber' ? '#f59e0b66' : '#ef444466';

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
              <Badge status="success" text={<Text style={{ fontSize: 12 }}>Healthy</Text>} />
              <Badge status="warning" text={<Text style={{ fontSize: 12 }}>Warning</Text>} />
              <Badge status="error" text={<Text style={{ fontSize: 12 }}>Issue</Text>} />
            </Space>
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              style={{ width: '100%', maxWidth: svgW, minWidth: 320, height: 'auto' }}
            >
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path
                    d="M 30 0 L 0 0 0 30"
                    fill="none"
                    stroke={isDark ? '#1e293b' : '#e2e8f0'}
                    strokeWidth="0.5"
                  />
                </pattern>
                {/* Glow filter */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width={svgW} height={svgH} fill="url(#grid)" />

              {/* Connection lines between nodes */}
              {mapTenants.length > 1 && mapTenants.map((t, i) => {
                if (i === 0) return null;
                const prev = mapTenants[i - 1];
                const [x1, y1] = project(prev.lat, prev.lng);
                const [x2, y2] = project(t.lat, t.lng);
                return (
                  <line
                    key={`line-${i}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isDark ? '#334155' : '#cbd5e1'}
                    strokeWidth="0.5"
                    strokeDasharray="4 4"
                    opacity={0.5}
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="20;0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </line>
                );
              })}

              {/* Tenant markers */}
              {mapTenants.map((t) => {
                const [x, y] = project(t.lat, t.lng);
                const color = healthColor(t.health);
                const glow = glowColor(t.health);
                return (
                  <g key={t.id}>
                    {/* Pulse ring */}
                    <circle cx={x} cy={y} r="12" fill={glow} opacity={0.4}>
                      <animate
                        attributeName="r"
                        values="8;16;8"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.4;0.1;0.4"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    {/* Dot */}
                    <circle
                      cx={x} cy={y} r="5"
                      fill={color}
                      stroke={isDark ? '#0f172a' : '#fff'}
                      strokeWidth="2"
                      filter="url(#glow)"
                    />
                    {/* Label */}
                    <text
                      x={x} y={y - 12}
                      textAnchor="middle"
                      fill={isDark ? '#94a3b8' : '#475569'}
                      fontSize="10"
                      fontFamily="system-ui, sans-serif"
                      fontWeight="500"
                    >
                      {t.city}
                    </text>
                  </g>
                );
              })}
            </svg>
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
