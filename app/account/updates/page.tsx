'use client';

import 'antd/dist/reset.css';
import { useState, useEffect } from 'react';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Tag,
  Spin,
  Empty,
  Tabs,
  Timeline,
} from 'antd';
import {
  RocketOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  RiseOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const BETA_SLUGS = [
  'wnct-times',
  'hendo',
  'oceanside-news',
  'hardhatsports',
  'atlanta-news-network',
  'the42',
];

interface PlatformRelease {
  id: string;
  type: 'release' | 'roadmap';
  title: string;
  description: string;
  version?: string;
  category: string;
  audience: string;
  publishedAt: string | null;
}

export default function AccountUpdatesPage() {
  const { isDark } = useTheme();
  const [releases, setReleases] = useState<PlatformRelease[]>([]);
  const [roadmap, setRoadmap] = useState<PlatformRelease[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        const userTenant = await getUserTenant(currentUser.uid);
        setTenant(userTenant);

        const db = getDb();
        const isBeta = userTenant?.slug && BETA_SLUGS.includes(userTenant.slug);

        const q = query(
          collection(db, 'platformReleases'),
          where('status', '==', 'published'),
          orderBy('publishedAt', 'desc'),
          limit(50)
        );

        const snapshot = await getDocs(q);
        const allItems: PlatformRelease[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type,
            title: data.title,
            description: data.description,
            version: data.version,
            category: data.category,
            audience: data.audience,
            publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
          };
        }).filter((item) => {
          if (item.audience === 'beta' && !isBeta) return false;
          return true;
        });

        setReleases(allItems.filter((r) => r.type === 'release'));
        setRoadmap(allItems.filter((r) => r.type === 'roadmap'));
      } catch (error) {
        console.error('Error loading updates:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature': return <RocketOutlined style={{ color: '#1890ff' }} />;
      case 'bugfix': return <ToolOutlined style={{ color: '#52c41a' }} />;
      case 'improvement': return <RiseOutlined style={{ color: '#722ed1' }} />;
      default: return <CheckCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getCategoryTag = (category: string) => {
    const colors: Record<string, string> = {
      feature: 'blue',
      bugfix: 'green',
      improvement: 'purple',
    };
    return <Tag color={colors[category] || 'default'}>{category}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const renderTimeline = (items: PlatformRelease[]) => {
    if (items.length === 0) {
      return <Empty description="No updates yet" />;
    }

    // Group by version
    const grouped = new Map<string, PlatformRelease[]>();
    for (const item of items) {
      const key = item.version || 'Unversioned';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(item);
    }

    return (
      <Timeline
        items={Array.from(grouped.entries()).map(([version, versionItems]) => ({
          dot: <RocketOutlined style={{ fontSize: '16px', color: '#1890ff' }} />,
          children: (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: '13px', padding: '2px 10px' }}>
                  {version}
                </Tag>
                {versionItems[0].publishedAt && (
                  <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                    {new Date(versionItems[0].publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {versionItems.map((item) => (
                  <Card key={item.id} size="small" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      {getCategoryIcon(item.category)}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <Text strong>{item.title}</Text>
                          {getCategoryTag(item.category)}
                        </div>
                        <Paragraph
                          type="secondary"
                          style={{ margin: 0, fontSize: '13px' }}
                        >
                          {item.description}
                        </Paragraph>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ),
        }))}
      />
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>Platform Updates</Title>
        <Text type="secondary">
          See what&apos;s new and what&apos;s coming to your newspaper
        </Text>
        {tenant?.lastRolloutVersion && (
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary">Your paper is running </Text>
            <Tag color="blue" style={{ fontFamily: 'monospace' }}>{tenant.lastRolloutVersion}</Tag>
            {tenant.lastRolloutAt && (
              <Text type="secondary">
                updated {new Date((tenant.lastRolloutAt.seconds || 0) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
          </div>
        )}
      </div>

      <Tabs
        defaultActiveKey="releases"
        items={[
          {
            key: 'releases',
            label: (
              <span>
                <RocketOutlined style={{ marginRight: '6px' }} />
                What&apos;s New ({releases.length})
              </span>
            ),
            children: renderTimeline(releases),
          },
          {
            key: 'roadmap',
            label: (
              <span>
                <BulbOutlined style={{ marginRight: '6px' }} />
                Coming Soon ({roadmap.length})
              </span>
            ),
            children: roadmap.length > 0 ? renderTimeline(roadmap) : (
              <Empty description="Roadmap items coming soon" />
            ),
          },
        ]}
      />
    </div>
  );
}
