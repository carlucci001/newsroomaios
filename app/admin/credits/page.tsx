'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, runTransaction } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Progress,
  Empty,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  WarningOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CREDIT_COSTS = {
  article: 5,
  image: 2,
  image_hd: 4,
  tts: 1,
  agent: 3,
  ad_creation: 5,
  ad_manual: 1,
};

interface TenantWithCredits extends Tenant {
  subscriptionCredits: number;
  topOffCredits: number;
  totalCredits: number;
}

interface CreditTransaction {
  id: string;
  tenantId: string;
  type: string;
  creditPool?: string;
  feature?: string;
  amount: number;
  subscriptionBalance?: number;
  topOffBalance?: number;
  description: string;
  createdAt: Date | any;
}

interface CreditOverview {
  totalSubscription: number;
  totalTopOff: number;
  totalCredits: number;
  tenantsLowCredits: number;
  totalTransactions: number;
}

export default function CreditsPage() {
  const { isDark } = useTheme();
  const [tenants, setTenants] = useState<TenantWithCredits[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const db = getDb();

      const tenantsSnap = await getDocs(collection(db, 'tenants'));
      const tenantsData = tenantsSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        const subscriptionCredits = data.subscriptionCredits || 0;
        const topOffCredits = data.topOffCredits || 0;
        return {
          id: docSnap.id,
          ...data,
          subscriptionCredits,
          topOffCredits,
          totalCredits: subscriptionCredits + topOffCredits,
        } as TenantWithCredits;
      });
      setTenants(tenantsData);

      try {
        const transactionsSnap = await getDocs(collection(db, 'creditTransactions'));
        const transactionsData = transactionsSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          } as CreditTransaction;
        });
        setTransactions(transactionsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 100));
      } catch (e) {
        console.error('Error fetching transactions:', e);
      }
    } catch (error) {
      console.error('Failed to fetch credit data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function adjustCredits(values: any) {
    setAdjustLoading(true);
    try {
      const db = getDb();
      const amount = parseInt(values.amount);
      const tenantId = values.tenant;
      const adjustPool = values.pool;
      const adjustReason = values.reason || '';

      const tenant = tenants.find((t) => t.id === tenantId);
      if (!tenant) {
        Modal.error({ title: 'Error', content: 'Tenant not found' });
        return;
      }

      const tenantRef = doc(db, 'tenants', tenantId);

      await runTransaction(db, async (transaction) => {
        const tenantSnap = await transaction.get(tenantRef);

        if (!tenantSnap.exists()) {
          throw new Error('Tenant not found');
        }

        const data = tenantSnap.data();
        let subscriptionCredits = data.subscriptionCredits || 0;
        let topOffCredits = data.topOffCredits || 0;

        if (adjustPool === 'subscription') {
          subscriptionCredits = Math.max(0, subscriptionCredits + amount);
        } else {
          topOffCredits = Math.max(0, topOffCredits + amount);
        }

        transaction.update(tenantRef, {
          subscriptionCredits,
          topOffCredits,
          updatedAt: new Date(),
        });

        const transactionRef = doc(collection(db, 'creditTransactions'));
        transaction.set(transactionRef, {
          tenantId,
          type: 'adjustment',
          creditPool: adjustPool,
          amount,
          subscriptionBalance: subscriptionCredits,
          topOffBalance: topOffCredits,
          description: adjustReason || `Manual ${adjustPool} credit adjustment`,
          createdAt: new Date(),
        });
      });

      await fetchData();
      setShowAdjustModal(false);
      form.resetFields();
      Modal.success({ title: 'Success', content: 'Credits adjusted successfully' });
    } catch (error) {
      console.error('Failed to adjust credits:', error);
      Modal.error({ title: 'Error', content: 'Failed to adjust credits: ' + (error as Error).message });
    } finally {
      setAdjustLoading(false);
    }
  }

  const overview: CreditOverview = {
    totalSubscription: tenants.reduce((sum, t) => sum + t.subscriptionCredits, 0),
    totalTopOff: tenants.reduce((sum, t) => sum + t.topOffCredits, 0),
    totalCredits: tenants.reduce((sum, t) => sum + t.totalCredits, 0),
    tenantsLowCredits: tenants.filter((t) => t.totalCredits < 50).length,
    totalTransactions: transactions.length,
  };

  const usageByFeature = transactions
    .filter((t) => t.type === 'usage' && t.feature)
    .reduce((acc, t) => {
      const feature = t.feature || 'unknown';
      if (!acc[feature]) acc[feature] = { count: 0, credits: 0 };
      acc[feature].count++;
      acc[feature].credits += Math.abs(t.amount);
      return acc;
    }, {} as Record<string, { count: number; credits: number }>);

  const tenantColumns: TableColumnsType<TenantWithCredits> = [
    {
      title: <Text strong>Business Name</Text>,
      dataIndex: 'businessName',
      key: 'businessName',
      sorter: (a, b) => (a.businessName || '').localeCompare(b.businessName || ''),
      render: (text: string, record) => (
        <div>
          <Text strong>{text || record.id}</Text>
          {record.plan && (
            <div>
              <Tag color="blue" style={{ marginTop: '4px', fontSize: '11px' }}>
                {record.plan}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: <Text strong>Subscription</Text>,
      dataIndex: 'subscriptionCredits',
      key: 'subscriptionCredits',
      sorter: (a, b) => a.subscriptionCredits - b.subscriptionCredits,
      render: (value: number) => (
        <Text>{value.toLocaleString()}</Text>
      ),
    },
    {
      title: <Text strong>Top-Off</Text>,
      dataIndex: 'topOffCredits',
      key: 'topOffCredits',
      sorter: (a, b) => a.topOffCredits - b.topOffCredits,
      render: (value: number) => (
        <Text>{value.toLocaleString()}</Text>
      ),
    },
    {
      title: <Text strong>Total</Text>,
      dataIndex: 'totalCredits',
      key: 'totalCredits',
      sorter: (a, b) => a.totalCredits - b.totalCredits,
      render: (value: number) => {
        const status = value === 0 ? 'exhausted' : value < 50 ? 'warning' : 'active';
        return (
          <Space>
            <Text strong>{value.toLocaleString()}</Text>
            <Tag color={status === 'exhausted' ? 'error' : status === 'warning' ? 'warning' : 'success'}>
              {status}
            </Tag>
          </Space>
        );
      },
    },
  ];

  const transactionColumns: TableColumnsType<CreditTransaction> = [
    {
      title: <Text strong>Tenant</Text>,
      dataIndex: 'tenantId',
      key: 'tenantId',
      render: (tenantId: string) => {
        const tenant = tenants.find((t) => t.id === tenantId);
        return <Text>{tenant?.businessName || tenantId}</Text>;
      },
    },
    {
      title: <Text strong>Type</Text>,
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          usage: 'error',
          subscription: 'success',
          topoff: 'processing',
          bonus: 'warning',
          adjustment: 'default',
        };
        return <Tag color={colorMap[type] || 'default'}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: <Text strong>Pool</Text>,
      dataIndex: 'creditPool',
      key: 'creditPool',
      render: (pool: string) => <Text type="secondary">{pool || '-'}</Text>,
    },
    {
      title: <Text strong>Description</Text>,
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => <Text type="secondary">{desc}</Text>,
    },
    {
      title: <Text strong>Credits</Text>,
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number) => (
        <Text strong style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f' }}>
          {amount > 0 ? '+' : ''}{amount}
        </Text>
      ),
    },
    {
      title: <Text strong>Time</Text>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'right',
      render: (date: Date | any) => {
        const timestamp = date instanceof Date ? date : new Date(date?.seconds * 1000 || Date.now());
        return <Text type="secondary" style={{ fontSize: '12px' }}>{timestamp.toLocaleString()}</Text>;
      },
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh' }}>
      <Space vertical size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Credit Management</Title>
            <Text type="secondary">Monitor and manage tenant credit usage</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setShowAdjustModal(true)}>
            Adjust Credits
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Subscription Credits</Text>}
                value={overview.totalSubscription}
                prefix={<DollarOutlined style={{ color: '#3b82f6' }} />}
                styles={{ content: { fontSize: '28px' } }}
                suffix={<Text type="secondary" style={{ fontSize: '14px' }}>monthly</Text>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Top-Off Credits</Text>}
                value={overview.totalTopOff}
                prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
                styles={{ content: { fontSize: '28px' } }}
                suffix={<Text type="secondary" style={{ fontSize: '14px' }}>purchased</Text>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Low Credit Tenants</Text>}
                value={overview.tenantsLowCredits}
                prefix={<WarningOutlined style={{ color: overview.tenantsLowCredits > 0 ? '#ff4d4f' : '#52c41a' }} />}
                styles={{ content: { fontSize: '28px' } }}
                suffix={<Text type="secondary" style={{ fontSize: '14px' }}>below 50</Text>}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={<Title level={4} style={{ margin: 0 }}>Tenant Balances</Title>}>
              <Table
                columns={tenantColumns}
                dataSource={tenants.sort((a, b) => a.totalCredits - b.totalCredits)}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 600 }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={<Title level={4} style={{ margin: 0 }}>Usage by Feature</Title>}
              extra={<Text type="secondary">Credit consumption breakdown</Text>}
            >
              {Object.keys(usageByFeature).length === 0 ? (
                <Empty description="No usage data yet" style={{ padding: '40px 0' }} />
              ) : (
                <Space vertical size="middle" style={{ width: '100%' }}>
                  {Object.entries(usageByFeature)
                    .sort(([, a], [, b]) => b.credits - a.credits)
                    .map(([feature, data]) => (
                      <div key={feature}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div>
                            <Text strong>
                              {feature.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                              {data.count} operations
                            </Text>
                          </div>
                          <Text strong>{data.credits.toLocaleString()} credits</Text>
                        </div>
                        <Progress
                          percent={Math.round((data.credits / overview.totalCredits) * 100)}
                          strokeColor="#3b82f6"
                          size="small"
                        />
                      </div>
                    ))}

                  <Card size="small" style={{ marginTop: '16px' }}>
                    <Title level={5} style={{ margin: '0 0 12px 0' }}>Credit Costs</Title>
                    <Row gutter={[8, 8]}>
                      {Object.entries(CREDIT_COSTS).map(([feature, cost]) => (
                        <Col span={12} key={feature}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: '12px' }} type="secondary">
                              {feature.replace(/_/g, ' ')}
                            </Text>
                            <Text strong style={{ fontSize: '12px' }}>{cost}</Text>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Space>
              )}
            </Card>
          </Col>
        </Row>

        <Card title={<Title level={4} style={{ margin: 0 }}>Average Production Costs (Platform)</Title>}
              extra={<Tag color="blue">Internal — Not visible to tenants</Tag>}
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Estimated average dollar cost to the platform per operation, based on API usage and token consumption.
          </Text>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title={<Text strong>Generate a Story</Text>}
                  value={0.037}
                  precision={3}
                  prefix="$"
                  styles={{ content: { fontSize: '28px', color: '#3b82f6' } }}
                />
                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '8px' }}>
                  Avg across Gemini + Perplexity web search
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title={<Text strong>Produce an Image</Text>}
                  value={0.012}
                  precision={3}
                  prefix="$"
                  styles={{ content: { fontSize: '28px', color: '#52c41a' } }}
                />
                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '8px' }}>
                  Avg across Pexels search + AI image generation
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title={<Text strong>Add a Directory Listing</Text>}
                  value={0.009}
                  precision={3}
                  prefix="$"
                  styles={{ content: { fontSize: '28px', color: '#faad14' } }}
                />
                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '8px' }}>
                  Avg Google Places API lookup + data enrichment
                </Text>
              </Card>
            </Col>
          </Row>
        </Card>

        <Card title={<Title level={4} style={{ margin: 0 }}>Recent Activity</Title>}>
          <Table
            columns={transactionColumns}
            dataSource={transactions.slice(0, 20)}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1000 }}
            locale={{ emptyText: <Empty description="No activity recorded yet" /> }}
          />
        </Card>
      </Space>

      <Modal
        title="Adjust Credits"
        open={showAdjustModal}
        onCancel={() => {
          setShowAdjustModal(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={adjustCredits}
          initialValues={{ pool: 'topoff' }}
        >
          <Form.Item
            name="tenant"
            label="Select Tenant"
            rules={[{ required: true, message: 'Please select a tenant' }]}
          >
            <Select
              showSearch
              placeholder="Choose a tenant..."
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={tenants.map((tenant) => ({
                value: tenant.id,
                label: `${tenant.businessName || tenant.id} (${tenant.totalCredits} credits)`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="pool"
            label="Credit Pool"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="topoff">Top-Off Credits (never expire)</Select.Option>
              <Select.Option value="subscription">Subscription Credits (expire monthly)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Credit Amount"
            rules={[
              { required: true, message: 'Please enter an amount' },
              { pattern: /^-?\d+$/, message: 'Please enter a valid number' },
            ]}
            extra="Use positive numbers to add credits, negative to deduct"
          >
            <Input
              type="number"
              placeholder="Enter amount (e.g., 100 or -50)"
              prefix={<ThunderboltOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason (Optional)"
          >
            <TextArea
              rows={3}
              placeholder="e.g., Bonus for promotional period"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setShowAdjustModal(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={adjustLoading}>
                Apply Adjustment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
