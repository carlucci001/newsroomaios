'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { TenantCredits, CreditUsage } from '@/types/credits';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Tag,
  Button,
  Space,
  Spin,
  Empty,
} from 'antd';
import {
  TeamOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  WarningOutlined,
  PlusOutlined,
  DollarOutlined,
  UploadOutlined,
  SettingOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  UserAddOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  deployedTenants: number;
  suspendedTenants: number;
  totalCreditsUsed: number;
  totalRevenue: number;
  recentTenants: Tenant[];
  creditWarnings: TenantCredits[];
  recentUsage: CreditUsage[];
  tenantNameMap: Record<string, string>;
}

export default function AdminDashboard() {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const db = getDb();

        // Fetch tenants
        const tenantsSnap = await getDocs(collection(db, 'tenants'));
        const tenants = tenantsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Tenant[];

        // Calculate tenant stats
        const activeTenants = tenants.filter((t) => t.status === 'active').length;
        const deployedTenants = tenants.filter((t) => t.status === 'active' && t.siteUrl).length;
        const suspendedTenants = tenants.filter((t) => t.status === 'suspended').length;

        // Get recent tenants (last 5)
        const recentTenants = tenants
          .sort((a, b) => {
            const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt as any);
            const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt as any);
            return bDate.getTime() - aDate.getTime();
          })
          .slice(0, 5);

        // Fetch credit data
        const creditsSnap = await getDocs(collection(db, 'tenantCredits'));
        const credits = creditsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TenantCredits[];

        // Build tenantId → name lookup
        const tenantNameMap: Record<string, string> = {};
        tenants.forEach((t) => {
          tenantNameMap[t.id] = t.businessName || t.slug || t.id;
        });

        // Find tenants with credit warnings
        const creditWarnings = credits.filter(
          (c) => c.status === 'warning' || c.status === 'exhausted'
        );

        // Calculate total credits used
        const totalCreditsUsed = credits.reduce((sum, c) => sum + (c.creditsUsed || 0), 0);

        // Fetch recent usage (last 10)
        let recentUsage: CreditUsage[] = [];
        try {
          const usageQuery = query(
            collection(db, 'creditUsage'),
            orderBy('timestamp', 'desc'),
            limit(10)
          );
          const usageSnap = await getDocs(usageQuery);
          recentUsage = usageSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as CreditUsage[];
        } catch (e) {
          // Collection might not exist yet
        }

        setStats({
          totalTenants: tenants.length,
          activeTenants,
          deployedTenants,
          suspendedTenants,
          totalCreditsUsed,
          totalRevenue: 0,
          recentTenants,
          creditWarnings,
          recentUsage,
          tenantNameMap,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Empty description="Failed to load dashboard data" />
      </div>
    );
  }

  const activePercentage = stats.totalTenants > 0
    ? Math.round((stats.activeTenants / stats.totalTenants) * 100)
    : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      <Space vertical size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div>
          <Title level={2} style={{ margin: 0 }}>Dashboard Overview</Title>
          <Text type="secondary">Monitor your newspaper network and manage tenant resources</Text>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Total Newspapers</Text>}
                value={stats.totalTenants}
                prefix={<TeamOutlined style={{ color: '#3b82f6' }} />}
                styles={{ content: { fontSize: '32px' } }}
              />
              <div style={{ marginTop: '12px' }}>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  {stats.activeTenants} active
                </Text>
                <Progress
                  percent={activePercentage}
                  strokeColor="#3b82f6"
                  size="small"
                  showInfo={false}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Deployed Sites</Text>}
                value={stats.deployedTenants}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                styles={{ content: { fontSize: '32px' } }}
                suffix={<Text type="secondary" style={{ fontSize: '14px' }}>live</Text>}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Credits Used</Text>}
                value={stats.totalCreditsUsed}
                prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
                styles={{ content: { fontSize: '32px' } }}
              />
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                this billing cycle
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Credit Warnings</Text>}
                value={stats.creditWarnings.length}
                prefix={<WarningOutlined style={{ color: stats.creditWarnings.length > 0 ? '#ff4d4f' : '#52c41a' }} />}
                styles={{ content: { fontSize: '32px' } }}
                suffix={<Text type="secondary" style={{ fontSize: '14px' }}>tenants</Text>}
              />
            </Card>
          </Col>
        </Row>

        {/* Two Column Layout */}
        <Row gutter={[16, 16]}>
          {/* Recent Newspapers */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>Recent Newspapers</Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Latest tenant sign-ups</Text>
                  </div>
                  <Link href="/admin/tenants">
                    <Button type="text" icon={<ArrowRightOutlined />}>
                      View All
                    </Button>
                  </Link>
                </div>
              }
            >
              {stats.recentTenants.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No newspapers yet"
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <Space vertical size="small" style={{ width: '100%' }}>
                  {stats.recentTenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <Link href={`/admin/tenants/${tenant.id}`}>
                          <Text strong>{tenant.businessName}</Text>
                        </Link>
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>{tenant.domain}</Text>
                        </div>
                      </div>
                      <Tag
                        color={
                          tenant.status === 'active' ? 'success' :
                          tenant.status === 'seeding' ? 'warning' :
                          tenant.status === 'suspended' ? 'error' :
                          'default'
                        }
                      >
                        {tenant.status}
                      </Tag>
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          </Col>

          {/* Credit Alerts */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>Credit Alerts</Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Tenants requiring attention</Text>
                  </div>
                  <Link href="/admin/credits">
                    <Button type="text" icon={<ArrowRightOutlined />}>
                      Manage
                    </Button>
                  </Link>
                </div>
              }
            >
              {stats.creditWarnings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                  <Paragraph type="secondary">All tenants have healthy credit balances</Paragraph>
                </div>
              ) : (
                <List
                  dataSource={stats.creditWarnings}
                  renderItem={(credit) => {
                    const percentage = credit.monthlyAllocation > 0
                      ? Math.round((credit.creditsRemaining / credit.monthlyAllocation) * 100)
                      : 0;

                    return (
                      <List.Item
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <Text strong>{stats.tenantNameMap[credit.tenantId] || credit.tenantId}</Text>
                            <Space>
                              <Tag color={credit.status === 'exhausted' ? 'error' : 'warning'}>
                                {credit.status}
                              </Tag>
                              <Link href="/admin/credits">
                                <Button type="link" size="small" icon={<DollarOutlined />}>
                                  Top Off
                                </Button>
                              </Link>
                            </Space>
                          </div>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                            {credit.creditsRemaining} of {credit.monthlyAllocation} credits remaining
                          </Text>
                          <Progress
                            percent={percentage}
                            strokeColor={credit.status === 'exhausted' ? '#ff4d4f' : '#faad14'}
                            size="small"
                          />
                        </div>
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card title={<Title level={4} style={{ margin: 0 }}>Quick Actions</Title>}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} lg={4}>
              <Link href="/admin/tenants/new">
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#1890ff',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <PlusOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </div>
                  <Text strong>Add Newspaper</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={12} sm={8} lg={4}>
              <Link href="/admin/leads">
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#722ed1',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <UserAddOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </div>
                  <Text strong>Manage Leads</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={12} sm={8} lg={4}>
              <Link href="/admin/credits">
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#52c41a',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <DollarOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </div>
                  <Text strong>Manage Credits</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={12} sm={8} lg={4}>
              <Link href="/admin/analytics">
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#722ed1',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <MessageOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </div>
                  <Text strong>Message Partners</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={12} sm={8} lg={4}>
              <Link href="/admin/updates">
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#faad14',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <UploadOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </div>
                  <Text strong>Deploy Update</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={12} sm={8} lg={4}>
              <Link href="/admin/settings">
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#8c8c8c',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <SettingOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </div>
                  <Text strong>Settings</Text>
                </Card>
              </Link>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
}
