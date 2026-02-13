'use client';

import 'antd/dist/reset.css';
import { useState, useEffect } from 'react';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { getDb } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import {
  Card,
  Typography,
  Button,
  Tag,
  Row,
  Col,
  Space,
  Divider,
  Spin,
  Modal,
  message,
  Table,
} from 'antd';
import {
  CreditCardOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  QuestionCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    credits: 250,
    features: [
      '250 AI credits/month',
      '1 AI journalist',
      '50 articles/month',
      'Email support',
      'Basic analytics',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 199,
    credits: 575,
    features: [
      '575 AI credits/month',
      '3 AI journalists',
      '115 articles/month',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
    ],
    badge: 'Popular',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    credits: 1000,
    features: [
      '1,000 AI credits/month',
      '6 AI journalists',
      '200 articles/month',
      'Dedicated support',
      'Full analytics suite',
      'Custom integrations',
      'AI banner generation',
    ],
  },
];

interface Invoice {
  id: string;
  amountPaid: number;
  status: string;
  paidAt: any;
  hostedInvoiceUrl?: string;
}

export default function BillingPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const userTenant = await getUserTenant(user.uid);
        setTenant(userTenant);

        if (userTenant?.id) {
          try {
            const db = getDb();
            const invoicesQuery = query(
              collection(db, 'invoices'),
              where('tenantId', '==', userTenant.id),
              orderBy('paidAt', 'desc'),
              limit(10)
            );
            const snap = await getDocs(invoicesQuery);
            setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice)));
          } catch (err) {
            console.warn('Could not load invoices:', err);
          }
        }
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const openStripePortal = async () => {
    if (!tenant?.id) return;
    setPortalLoading(true);

    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        message.error(data.error || 'Could not open billing portal');
      }
    } catch (error) {
      console.error('Portal error:', error);
      message.error('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const handlePlanChange = async (newPlanId: string) => {
    if (!tenant?.id) return;
    setUpgradeLoading(newPlanId);

    try {
      const res = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id, newPlanId }),
      });

      const data = await res.json();
      if (data.success) {
        message.success(`Plan updated to ${newPlanId}!`);
        setTenant({ ...tenant, plan: newPlanId });
        setConfirmPlan(null);
      } else {
        message.error(data.error || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Plan change error:', error);
      message.error('Failed to update plan');
    } finally {
      setUpgradeLoading(null);
    }
  };

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

  const currentPlanId = tenant.plan || 'starter';
  const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0];
  const isActive = tenant.licensingStatus === 'active' || tenant.status === 'active';
  const hasStripe = !!tenant.stripeCustomerId;

  let nextBillingDisplay = 'Not available';
  if (tenant.nextBillingDate) {
    const d = tenant.nextBillingDate?.toDate ? tenant.nextBillingDate.toDate() : new Date(tenant.nextBillingDate);
    nextBillingDisplay = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      <Space vertical size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>Billing & Subscription</Title>
          <Text type="secondary">Manage your plan and payment methods</Text>
        </div>

        {/* Current Plan */}
        <Card
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white',
          }}
        >
          <Space vertical size="middle" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Current Plan</Text>
                <Title level={2} style={{ color: 'white', margin: '8px 0' }}>
                  {currentPlan.name}
                </Title>
                <Text style={{ color: 'white', fontSize: '18px' }}>
                  ${currentPlan.price}/month • {currentPlan.credits} credits
                </Text>
              </div>
              <Tag color={isActive ? 'success' : 'warning'} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {isActive ? 'Active' : (tenant.licensingStatus || 'Inactive')}
              </Tag>
            </div>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '16px 0' }} />

            <Row gutter={24}>
              <Col xs={24} sm={8}>
                <CalendarOutlined style={{ fontSize: '20px', color: 'white', marginBottom: '8px' }} />
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', display: 'block', fontSize: '12px' }}>
                    Next Billing
                  </Text>
                  <Text strong style={{ color: 'white', fontSize: '16px' }}>
                    {nextBillingDisplay}
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <DollarOutlined style={{ fontSize: '20px', color: 'white', marginBottom: '8px' }} />
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', display: 'block', fontSize: '12px' }}>
                    Monthly Credits
                  </Text>
                  <Text strong style={{ color: 'white', fontSize: '16px' }}>
                    {currentPlan.credits} credits
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <CalendarOutlined style={{ fontSize: '20px', color: 'white', marginBottom: '8px' }} />
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', display: 'block', fontSize: '12px' }}>
                    Billing Cycle
                  </Text>
                  <Text strong style={{ color: 'white', fontSize: '16px' }}>
                    Monthly
                  </Text>
                </div>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* Manage Buttons */}
        <Card>
          {hasStripe ? (
            <Space wrap>
              <Button
                type="primary"
                icon={<CreditCardOutlined />}
                size="large"
                onClick={openStripePortal}
                loading={portalLoading}
              >
                Manage Payment Method
              </Button>
              <Button
                danger
                size="large"
                onClick={openStripePortal}
                loading={portalLoading}
              >
                Cancel Subscription
              </Button>
            </Space>
          ) : (
            <Text type="secondary">
              No payment method on file. Contact support to set up billing.
            </Text>
          )}
        </Card>

        {/* Available Plans */}
        <div>
          <Title level={3} style={{ marginBottom: '16px' }}>
            Available Plans
          </Title>
          <Row gutter={[16, 16]}>
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const currentIdx = PLANS.findIndex(p => p.id === currentPlanId);
              const planIdx = PLANS.findIndex(p => p.id === plan.id);
              const isUpgrade = planIdx > currentIdx;

              return (
                <Col xs={24} md={8} key={plan.id}>
                  <Card
                    hoverable={!isCurrent}
                    style={{
                      height: '100%',
                      border: plan.badge ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      position: 'relative',
                    }}
                  >
                    {plan.badge && (
                      <Tag
                        color="blue"
                        style={{
                          position: 'absolute',
                          top: '-12px',
                          right: '16px',
                          fontSize: '12px',
                        }}
                      >
                        {plan.badge}
                      </Tag>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                      <div>
                        <Title level={4} style={{ marginBottom: '4px' }}>
                          {plan.name}
                        </Title>
                        <div>
                          <Text strong style={{ fontSize: '32px' }}>
                            ${plan.price}
                          </Text>
                          <Text type="secondary">/month</Text>
                        </div>
                      </div>

                      <div>
                        <Space vertical size="small" style={{ width: '100%' }}>
                          {plan.features.map((feature, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                              <Text>{feature}</Text>
                            </div>
                          ))}
                        </Space>
                      </div>

                      {isCurrent ? (
                        <Button block disabled>
                          Current Plan
                        </Button>
                      ) : hasStripe ? (
                        <Button
                          type="primary"
                          block
                          size="large"
                          loading={upgradeLoading === plan.id}
                          onClick={() => setConfirmPlan(plan.id)}
                        >
                          {isUpgrade ? 'Upgrade' : 'Downgrade'}
                        </Button>
                      ) : (
                        <Button block disabled>
                          Contact Support
                        </Button>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>

        {/* Billing History */}
        <Card title="Billing History">
          {invoices.length > 0 ? (
            <Table
              dataSource={invoices}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Date',
                  dataIndex: 'paidAt',
                  render: (val: any) => {
                    if (!val) return '—';
                    const d = val?.toDate ? val.toDate() : new Date(val);
                    return d.toLocaleDateString();
                  },
                },
                {
                  title: 'Amount',
                  dataIndex: 'amountPaid',
                  render: (val: number) => `$${((val || 0) / 100).toFixed(2)}`,
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (val: string) => (
                    <Tag color={val === 'paid' ? 'success' : 'default'}>
                      {val || 'unknown'}
                    </Tag>
                  ),
                },
                {
                  title: '',
                  dataIndex: 'hostedInvoiceUrl',
                  render: (url: string) =>
                    url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    ) : null,
                },
              ]}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">No invoices yet. Your first invoice will appear here after billing.</Text>
            </div>
          )}
        </Card>

        {/* Help */}
        <Card>
          <Space align="start">
            <QuestionCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <div>
              <Title level={5} style={{ marginBottom: '8px' }}>
                Need help with billing?
              </Title>
              <Paragraph style={{ marginBottom: '12px' }}>
                Our support team is here to help with any billing questions or concerns.
              </Paragraph>
              <Button type="primary" href="mailto:support@newsroomaios.com">
                Contact Support
              </Button>
            </div>
          </Space>
        </Card>
      </Space>

      {/* Plan Change Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>Confirm Plan Change</span>
          </div>
        }
        open={!!confirmPlan}
        onCancel={() => setConfirmPlan(null)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmPlan(null)} size="large">
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            size="large"
            loading={upgradeLoading === confirmPlan}
            onClick={() => confirmPlan && handlePlanChange(confirmPlan)}
          >
            Confirm Change
          </Button>,
        ]}
      >
        {confirmPlan && (() => {
          const newPlan = PLANS.find(p => p.id === confirmPlan);
          return (
            <Space vertical size="small" style={{ width: '100%' }}>
              <Text>
                You are switching from <Text strong>{currentPlan.name}</Text> (${currentPlan.price}/mo)
                to <Text strong>{newPlan?.name}</Text> (${newPlan?.price}/mo).
              </Text>
              <Text type="secondary">
                Your billing will be prorated. The change takes effect immediately.
              </Text>
            </Space>
          );
        })()}
      </Modal>
    </div>
  );
}
