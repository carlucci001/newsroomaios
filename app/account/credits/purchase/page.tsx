'use client';

import 'antd/dist/reset.css';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Spin,
  Modal,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CREDIT_PACKAGES = [
  {
    id: 'credits_50',
    credits: 50,
    price: 5,
    popular: false,
  },
  {
    id: 'credits_100',
    credits: 100,
    price: 10,
    popular: false,
  },
  {
    id: 'credits_250',
    credits: 250,
    price: 20,
    popular: true,
    savings: '20%',
  },
  {
    id: 'credits_500',
    credits: 500,
    price: 35,
    popular: false,
    savings: '30%',
  },
];

function PaymentForm({
  onSuccess,
  onError,
  packLabel,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
  packLabel: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements || !isReady) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });
    setSubmitting(false);
    if (error) {
      onError(error.message || 'Payment failed');
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
          {submitting ? 'Processing...' : isReady ? `Pay for ${packLabel}` : 'Loading...'}
        </Button>
      </div>
    </div>
  );
}

export default function PurchaseCreditsPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Payment modal state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<typeof CREDIT_PACKAGES[0] | null>(null);

  useEffect(() => {
    async function loadTenant() {
      try {
        const user = await getCurrentUser();
        if (!user) return;
        const tenant = await getUserTenant(user.uid);
        if (tenant?.id) setTenantId(tenant.id);
      } catch (err) {
        console.error('Error loading tenant:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTenant();
  }, []);

  const handlePurchase = async (packageId: string) => {
    if (!tenantId) {
      message.error('Account not found. Please try again.');
      return;
    }

    const pack = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pack) return;

    setPurchasing(packageId);

    try {
      const res = await fetch('/api/stripe/create-credit-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, packId: packageId }),
      });

      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setSelectedPack(pack);
        setPaymentOpen(true);
      } else {
        message.error(data.error || 'Failed to start payment');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      message.error('Failed to initiate purchase. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!tenantId || !paymentIntentId || !selectedPack) return;

    // Confirm and apply credits
    try {
      const res = await fetch('/api/stripe/confirm-credit-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          paymentIntentId,
          packId: selectedPack.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        message.success(`${data.creditsAdded} credits added to your account!`);
        setPaymentOpen(false);
        setClientSecret(null);
        setPaymentIntentId(null);
        setSelectedPack(null);
        // Navigate to credits page to see updated balance
        router.push('/account/credits');
      } else {
        message.error(data.error || 'Failed to apply credits. Please contact support.');
      }
    } catch (err) {
      console.error('Confirm error:', err);
      message.error('Payment succeeded but credits may take a moment to appear. Please check your credits page.');
      setPaymentOpen(false);
    }
  };

  const handlePaymentError = (msg: string) => {
    message.error(msg);
  };

  const handleCloseModal = () => {
    setPaymentOpen(false);
    setClientSecret(null);
    setPaymentIntentId(null);
    setSelectedPack(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      <Space vertical size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Purchase Credits
            </Title>
            <Text type="secondary">
              Top-off credits never expire and are used after your monthly subscription credits
            </Text>
          </div>
          <Link href="/account/credits">
            <Button icon={<ArrowLeftOutlined />} size="large">
              Back to Credits
            </Button>
          </Link>
        </div>

        {/* Info Card */}
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
              <CheckOutlined style={{ fontSize: '20px', color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <Title level={4} style={{ marginTop: 0, marginBottom: '8px' }}>
                Top-Off Credits Never Expire
              </Title>
              <Text>
                These credits are used automatically after your monthly subscription credits run out.
                They never expire and roll over indefinitely.
              </Text>
            </div>
          </div>
        </Card>

        {/* Credit Packages */}
        <Row gutter={[16, 16]}>
          {CREDIT_PACKAGES.map((pkg) => (
            <Col xs={24} sm={12} lg={6} key={pkg.id}>
              <Card
                style={pkg.popular ? { borderColor: '#1890ff', borderWidth: '2px' } : undefined}
              >
                {pkg.popular && (
                  <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <Tag color="blue">Popular</Tag>
                  </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <Title level={1} style={{ margin: 0 }}>
                    {pkg.credits}
                  </Title>
                  <Text type="secondary">credits</Text>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <Title level={2} style={{ margin: 0 }}>
                    ${pkg.price}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '12px' }}>one-time</Text>
                </div>

                {pkg.savings && (
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <Tag color="success">Save {pkg.savings}</Tag>
                  </div>
                )}

                <Space vertical size="small" style={{ width: '100%', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckOutlined style={{ color: '#52c41a' }} />
                    <Text>Never expires</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckOutlined style={{ color: '#52c41a' }} />
                    <Text>Use anytime</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckOutlined style={{ color: '#52c41a' }} />
                    <Text>${(pkg.price / pkg.credits).toFixed(2)}/credit</Text>
                  </div>
                </Space>

                <Button
                  type={pkg.popular ? 'primary' : 'default'}
                  block
                  size="large"
                  onClick={() => handlePurchase(pkg.id)}
                  loading={purchasing === pkg.id}
                  disabled={!tenantId || (purchasing !== null && purchasing !== pkg.id)}
                >
                  {purchasing === pkg.id ? 'Processing...' : 'Purchase'}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {/* FAQ */}
        <Card title={<Title level={4} style={{ margin: 0 }}>Frequently Asked Questions</Title>}>
          <Space vertical size="middle" style={{ width: '100%' }}>
            <div>
              <Title level={5} style={{ marginTop: 0, marginBottom: '4px' }}>
                When are top-off credits used?
              </Title>
              <Text>
                Top-off credits are automatically used after your monthly subscription credits are depleted.
                Your subscription credits reset each billing cycle, but top-off credits roll over indefinitely.
              </Text>
            </div>

            <div>
              <Title level={5} style={{ marginTop: 0, marginBottom: '4px' }}>
                Do top-off credits expire?
              </Title>
              <Text>
                No! Top-off credits never expire and remain available for as long as you maintain an active subscription.
              </Text>
            </div>

            <div>
              <Title level={5} style={{ marginTop: 0, marginBottom: '4px' }}>
                Can I get a refund on unused credits?
              </Title>
              <Text>
                Top-off credit purchases are non-refundable, but since they never expire, you can use them at any time in the future.
              </Text>
            </div>
          </Space>
        </Card>
      </Space>

      {/* Payment Modal */}
      <Modal
        title={selectedPack ? `Purchase ${selectedPack.credits} Credits — $${selectedPack.price}` : 'Payment'}
        open={paymentOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
        width={480}
      >
        {clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <PaymentForm
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              packLabel={selectedPack ? `${selectedPack.credits} Credits` : 'Credits'}
            />
          </Elements>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Preparing payment...</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
