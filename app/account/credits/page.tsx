'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
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
  Empty,
} from 'antd';
import {
  CreditCardOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  InfoCircleOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { Coins, Infinity } from 'lucide-react';

const { Title, Text } = Typography;

interface CreditTransaction {
  id: string;
  type: string;
  feature?: string;
  amount: number;
  subscriptionBalance?: number;
  topOffBalance?: number;
  description: string;
  createdAt: any;
}

export default function CreditsPage() {
  const { isDark } = useTheme();
  const [tenant, setTenant] = useState<any>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        const userTenant = await getUserTenant(currentUser.uid);
        setTenant(userTenant);

        // Fetch credit transactions for this tenant
        if (userTenant?.id) {
          const db = getDb();
          const transactionsQuery = query(
            collection(db, 'creditTransactions'),
            where('tenantId', '==', userTenant.id),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
          const transactionsSnap = await getDocs(transactionsQuery);
          const transactionsData = transactionsSnap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            } as CreditTransaction;
          });
          setTransactions(transactionsData);
        }
      } catch (error) {
        console.error('Error loading credit data:', error);
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
  const percentUsed = monthlyAllocation > 0 ? ((monthlyAllocation - subscriptionCredits) / monthlyAllocation) * 100 : 0;
  const creditPercentage = monthlyAllocation > 0 ? Math.round((subscriptionCredits / monthlyAllocation) * 100) : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      <Space vertical size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Credit Balance
            </Title>
            <Text type="secondary">
              Monitor your credit usage and purchase additional credits
            </Text>
          </div>
          <Link href="/account/credits/purchase">
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
            >
              Purchase Credits
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title={<Text strong>Subscription Credits</Text>}
                value={subscriptionCredits}
                suffix="credits"
                prefix={<CreditCardOutlined style={{ color: '#1890ff' }} />}
                styles={{ content: { fontSize: '32px' } }}
              />
              <div style={{ marginTop: '12px' }}>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  {subscriptionCredits} of {monthlyAllocation} monthly
                </Text>
                <Progress
                  percent={creditPercentage}
                  strokeColor="#1890ff"
                  size="small"
                  showInfo={false}
                />
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                  Resets on your billing date
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title={<Text strong>Top-Off Credits</Text>}
                value={topOffCredits}
                suffix="credits"
                prefix={<Infinity className="w-6 h-6" style={{ color: '#52c41a' }} />}
                styles={{ content: { fontSize: '32px' } }}
              />
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '12px' }}>
                Never expire
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title={<Text strong>Total Available</Text>}
                value={totalCredits}
                suffix="credits"
                prefix={<FallOutlined style={{ color: '#faad14' }} />}
                styles={{ content: { fontSize: '32px' } }}
              />
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '12px' }}>
                Ready to use
              </Text>
            </Card>
          </Col>
        </Row>

        {/* How Credits Work */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#1890ff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <InfoCircleOutlined style={{ fontSize: '20px', color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <Title level={4} style={{ marginTop: 0, marginBottom: '8px' }}>
                How Credit Usage Works
              </Title>
              <Text style={{ display: 'block', marginBottom: '12px' }}>
                Your subscription credits are used first, then top-off credits are consumed automatically.
              </Text>
              <Space vertical size="small">
                <Text>
                  <Text strong>1.</Text> Subscription credits reset every billing cycle
                </Text>
                <Text>
                  <Text strong>2.</Text> Top-off credits never expire and roll over indefinitely
                </Text>
                <Text>
                  <Text strong>3.</Text> Unused subscription credits don't carry over
                </Text>
              </Space>
            </div>
          </div>
        </Card>

        {/* Credit Usage This Month */}
        <Card title={<Title level={4} style={{ margin: 0 }}>Usage This Billing Cycle</Title>}>
          <Space vertical size="middle" style={{ width: '100%' }}>
            <Text type="secondary">
              {percentUsed.toFixed(0)}% of monthly subscription credits used
            </Text>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text strong>Subscription Credits</Text>
                <Text type="secondary">
                  {subscriptionCredits} / {monthlyAllocation}
                </Text>
              </div>
              <Progress
                percent={creditPercentage}
                strokeColor="#1890ff"
                size="small"
              />
            </div>

            {topOffCredits > 0 && (
              <div style={{ paddingTop: '16px', borderTop: '1px solid', borderColor: isDark ? '#424242' : '#f0f0f0' }}>
                <Text>
                  <Text strong style={{ color: '#52c41a' }}>{topOffCredits}</Text> top-off credits available
                </Text>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  These will be used after your subscription credits run out
                </Text>
              </div>
            )}

            <div style={{ paddingTop: '16px', borderTop: '1px solid', borderColor: isDark ? '#424242' : '#f0f0f0' }}>
              <Link href="/account/billing">
                <Button type="link" icon={<ArrowUpOutlined />} style={{ padding: 0 }}>
                  Upgrade your plan for more credits
                </Button>
              </Link>
            </div>
          </Space>
        </Card>

        {/* Transaction History */}
        <Card title={<Title level={4} style={{ margin: 0 }}>Recent Activity</Title>}>
          {transactions.length === 0 ? (
            <Empty
              image={<Coins className="w-12 h-12 mx-auto" style={{ opacity: 0.3 }} />}
              description={
                <Space vertical size="small">
                  <Text type="secondary">No transactions yet</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Your credit activity will appear here
                  </Text>
                </Space>
              }
            />
          ) : (
            <Space vertical size="small" style={{ width: '100%' }}>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '4px' }}>
                      <Tag
                        color={
                          tx.type === 'usage' ? 'error' :
                          tx.type === 'subscription' ? 'success' :
                          tx.type === 'topoff' ? 'processing' :
                          'default'
                        }
                      >
                        {tx.type}
                      </Tag>
                      {tx.feature && (
                        <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                          {tx.feature}
                        </Text>
                      )}
                    </div>
                    <Text>{tx.description}</Text>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {tx.createdAt instanceof Date
                        ? tx.createdAt.toLocaleString()
                        : new Date(tx.createdAt).toLocaleString()
                      }
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                    <Text strong style={{ color: tx.amount > 0 ? '#52c41a' : '#ff4d4f' }}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      Balance: {(tx.subscriptionBalance || 0) + (tx.topOffBalance || 0)}
                    </Text>
                  </div>
                </div>
              ))}
            </Space>
          )}
        </Card>
      </Space>
    </div>
  );
}
