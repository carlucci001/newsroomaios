'use client';

import 'antd/dist/reset.css';
import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
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
  DeleteOutlined,
  PlusOutlined,
  StarOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

function AddCardForm({ onSuccess, onError }: { onSuccess: () => void; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements || !isReady) return;
    setSubmitting(true);
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });
    setSubmitting(false);
    if (error) {
      onError(error.message || 'Failed to save card');
    } else {
      onSuccess();
    }
  };

  return (
    <div>
      <PaymentElement
        onReady={() => setIsReady(true)}
        options={{ wallets: { applePay: 'never', googlePay: 'never' } }}
      />
      <div style={{ marginTop: 16 }}>
        <Button
          type="primary"
          block
          size="large"
          loading={submitting}
          disabled={!stripe || !isReady}
          onClick={handleSubmit}
          icon={<CreditCardOutlined />}
        >
          {submitting ? 'Saving...' : isReady ? 'Save Card' : 'Loading...'}
        </Button>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null);

  // Payment method state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [pmLoading, setPmLoading] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [addCardClientSecret, setAddCardClientSecret] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [deletingCard, setDeletingCard] = useState<string | null>(null);

  const loadPaymentMethods = useCallback(async (tenantId: string) => {
    setPmLoading(true);
    try {
      const res = await fetch(`/api/stripe/payment-methods?tenantId=${encodeURIComponent(tenantId)}`);
      const data = await res.json();
      if (data.paymentMethods) {
        setPaymentMethods(data.paymentMethods);

        // Auto-set default if there's exactly one card and it's not default
        if (data.paymentMethods.length === 1 && !data.paymentMethods[0].isDefault) {
          await fetch('/api/stripe/set-default-payment-method', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId, paymentMethodId: data.paymentMethods[0].id }),
          });
          setPaymentMethods([{ ...data.paymentMethods[0], isDefault: true }]);
        }
      }
    } catch (err) {
      console.warn('Could not load payment methods:', err);
    } finally {
      setPmLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const userTenant = await getUserTenant(user.uid);
        setTenant(userTenant);

        if (userTenant?.id) {
          try {
            const invRes = await fetch(`/api/stripe/invoices?tenantId=${encodeURIComponent(userTenant.id)}`);
            const invData = await invRes.json();
            if (invData.invoices) {
              setInvoices(invData.invoices);
            }
          } catch (err) {
            console.warn('Could not load invoices:', err);
          }

          if (userTenant.stripeCustomerId) {
            await loadPaymentMethods(userTenant.id);
          }
        }
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [loadPaymentMethods]);

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

  const handleAddCard = async () => {
    if (!tenant?.id) return;
    setAddCardOpen(true);
    setAddCardClientSecret(null);

    try {
      const res = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setAddCardClientSecret(data.clientSecret);
      } else {
        message.error(data.error || 'Failed to prepare card form');
        setAddCardOpen(false);
      }
    } catch (error) {
      console.error('Setup intent error:', error);
      message.error('Failed to prepare card form');
      setAddCardOpen(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!tenant?.id) return;
    setSettingDefault(paymentMethodId);

    try {
      const res = await fetch('/api/stripe/set-default-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id, paymentMethodId }),
      });
      const data = await res.json();
      if (data.success) {
        message.success('Default payment method updated');
        await loadPaymentMethods(tenant.id);
      } else {
        message.error(data.error || 'Failed to update default');
      }
    } catch (error) {
      console.error('Set default error:', error);
      message.error('Failed to update default payment method');
    } finally {
      setSettingDefault(null);
    }
  };

  const handleDeleteCard = (paymentMethodId: string) => {
    Modal.confirm({
      title: 'Remove Card',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to remove this card? This cannot be undone.',
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        setDeletingCard(paymentMethodId);
        try {
          const res = await fetch('/api/stripe/detach-payment-method', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId: tenant.id, paymentMethodId }),
          });
          const data = await res.json();
          if (data.success) {
            message.success('Card removed');
            await loadPaymentMethods(tenant.id);
          } else {
            message.error(data.error || 'Failed to remove card');
          }
        } catch (error) {
          console.error('Delete card error:', error);
          message.error('Failed to remove card');
        } finally {
          setDeletingCard(null);
        }
      },
    });
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

        {/* Payment Methods */}
        <Card
          title={<Title level={4} style={{ margin: 0 }}>Payment Methods</Title>}
          extra={
            hasStripe && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCard}>
                Add Card
              </Button>
            )
          }
        >
          {!hasStripe ? (
            <Text type="secondary">
              No payment method on file. Contact support to set up billing.
            </Text>
          ) : pmLoading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Spin />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <CreditCardOutlined style={{ fontSize: '40px', color: '#d9d9d9', display: 'block', marginBottom: '12px' }} />
              <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>No cards on file</Text>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCard}>
                Add Your First Card
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {paymentMethods.map(pm => (
                <div
                  key={pm.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    border: pm.isDefault ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    borderRadius: '8px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <Space>
                    <CreditCardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <div>
                      <div>
                        <Text strong style={{ textTransform: 'capitalize' }}>{pm.brand}</Text>
                        <Text> ending in </Text>
                        <Text strong>{pm.last4}</Text>
                        {pm.isDefault && (
                          <Tag color="blue" style={{ marginLeft: '8px' }}>Default</Tag>
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Expires {pm.expMonth}/{pm.expYear}
                      </Text>
                    </div>
                  </Space>
                  {!pm.isDefault && (
                    <Space>
                      <Button
                        size="small"
                        icon={<StarOutlined />}
                        loading={settingDefault === pm.id}
                        onClick={() => handleSetDefault(pm.id)}
                      >
                        Set Default
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deletingCard === pm.id}
                        onClick={() => handleDeleteCard(pm.id)}
                      />
                    </Space>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Cancel Subscription */}
          {hasStripe && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
              <Button
                danger
                size="large"
                onClick={openStripePortal}
                loading={portalLoading}
              >
                Cancel Subscription
              </Button>
            </div>
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
                    return new Date(val).toLocaleDateString();
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

      {/* Add Card Modal */}
      <Modal
        title="Add Payment Method"
        open={addCardOpen}
        onCancel={() => {
          setAddCardOpen(false);
          setAddCardClientSecret(null);
        }}
        footer={null}
        destroyOnClose
      >
        {addCardClientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: addCardClientSecret,
              appearance: { theme: 'stripe', variables: { colorPrimary: '#1890ff' } },
            }}
          >
            <AddCardForm
              onSuccess={() => {
                message.success('Card added successfully');
                setAddCardOpen(false);
                setAddCardClientSecret(null);
                if (tenant?.id) loadPaymentMethods(tenant.id);
              }}
              onError={(msg) => message.error(msg)}
            />
          </Elements>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <Spin />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Preparing secure card form...</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
