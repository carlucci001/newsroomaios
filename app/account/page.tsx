'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Button,
  Space,
  Tag,
  Spin,
} from 'antd';
import {
  CreditCardOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  MessageOutlined,
  SettingOutlined,
  RiseOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AccountDashboard() {
  const { isDark } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        setUser(currentUser);
        const userTenant = await getUserTenant(currentUser.uid);
        setTenant(userTenant);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text type="secondary">No tenant found for your account.</Text>
      </div>
    );
  }

  const subscriptionCredits = tenant.subscriptionCredits || 0;
  const topOffCredits = tenant.topOffCredits || 0;
  const totalCredits = subscriptionCredits + topOffCredits;
  const monthlyAllocation = tenant.plan === 'professional' ? 1000 :
                            tenant.plan === 'growth' ? 575 : 250;
  const creditPercentage = monthlyAllocation > 0 ? Math.round((subscriptionCredits / monthlyAllocation) * 100) : 0;

  const isActive = tenant.status === 'active' || tenant.status === 'seeding';
  const nextBillingDate = tenant.nextBillingDate
    ? new Date(tenant.nextBillingDate.seconds * 1000).toLocaleDateString()
    : 'N/A';

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      <Space vertical size="large" style={{ width: '100%' }}>
        {/* Welcome Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Welcome back, {user?.email?.split('@')[0] || 'User'}
            </Title>
            <Text type="secondary">
              {tenant.businessName} • {tenant.plan || 'Starter'} Plan
            </Text>
          </div>
          {tenant.domain && (
            <Button
              type="primary"
              size="large"
              icon={<ArrowUpOutlined />}
              href={`https://${tenant.domain}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Your Newspaper
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title={<Text strong>Credit Balance</Text>}
                value={totalCredits}
                suffix="credits"
                prefix={<CreditCardOutlined style={{ color: '#52c41a' }} />}
                styles={{ content: { fontSize: '32px' } }}
              />
              <div style={{ marginTop: '12px' }}>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  {subscriptionCredits} subscription + {topOffCredits} top-off
                </Text>
                <Progress
                  percent={creditPercentage}
                  strokeColor="#52c41a"
                  size="small"
                  showInfo={false}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title={<Text strong>Account Status</Text>}
                value={isActive ? 'Active' : 'Inactive'}
                prefix={<CheckCircleOutlined style={{ color: isActive ? '#52c41a' : '#faad14' }} />}
                styles={{ content: { fontSize: '28px' } }}
              />
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '12px' }}>
                Next billing: {nextBillingDate}
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title={<Text strong>Monthly Allocation</Text>}
                value={monthlyAllocation}
                suffix="credits"
                prefix={<RiseOutlined style={{ color: '#1890ff' }} />}
                styles={{ content: { fontSize: '32px' } }}
              />
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '12px' }}>
                Resets on billing date
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card title={<Title level={4} style={{ margin: 0 }}>Quick Actions</Title>}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Link href="/account/billing">
                <Card hoverable style={{ textAlign: 'center' }}>
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
                    <CreditCardOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </div>
                  <Text strong>Manage Billing</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={12} sm={6}>
              <Link href="/account/credits/purchase">
                <Card hoverable style={{ textAlign: 'center' }}>
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
                    <PlusOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </div>
                  <Text strong>Buy Credits</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={12} sm={6}>
              <Link href="/account/messages">
                <Card hoverable style={{ textAlign: 'center' }}>
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
                  <Text strong>Messages</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={12} sm={6}>
              <Link href="/account/settings">
                <Card hoverable style={{ textAlign: 'center' }}>
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

        {/* Plan Details */}
        <Card title={<Title level={4} style={{ margin: 0 }}>Current Plan</Title>}>
          <Space vertical size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Title level={3} style={{ margin: 0, textTransform: 'capitalize' }}>
                {tenant.plan || 'Starter'}
              </Title>
              <Tag color={isActive ? 'success' : 'warning'}>
                {isActive ? 'Active' : tenant.status}
              </Tag>
            </div>
            <div>
              <Text type="secondary">
                Your plan includes {monthlyAllocation} AI credits per month
                {tenant.plan === 'professional' && ', 6 AI journalists, and advanced features'}
                {tenant.plan === 'growth' && ', 3 AI journalists, and priority support'}
                {(!tenant.plan || tenant.plan === 'starter') && ' and 1 AI journalist'}
              </Text>
            </div>
            <Link href="/account/billing">
              <Button type="primary">Manage Plan</Button>
            </Link>
          </Space>
        </Card>
      </Space>
    </div>
  );
}
