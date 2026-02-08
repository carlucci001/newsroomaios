'use client';

import 'antd/dist/reset.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_PLANS } from '@/types/credits';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Card,
  Typography,
  Button,
  Input,
  Select,
  Form,
  Row,
  Col,
  Alert,
  Space,
  Descriptions,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  CreditCardOutlined,
  LoadingOutlined,
  DollarOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const SETUP_FEE = 199;
const PLAN_MONTHLY: Record<string, number> = {
  starter: 99,
  growth: 199,
  professional: 299,
};

const DEFAULT_CATEGORIES = [
  { id: 'local-news', name: 'Local News', slug: 'local-news', directive: 'Local community news and events', enabled: true },
  { id: 'sports', name: 'Sports', slug: 'sports', directive: 'Local sports coverage', enabled: true },
  { id: 'business', name: 'Business', slug: 'business', directive: 'Local business news and economy', enabled: true },
  { id: 'weather', name: 'Weather', slug: 'weather', directive: 'Weather forecasts and alerts', enabled: true },
  { id: 'community', name: 'Community', slug: 'community', directive: 'Community events and announcements', enabled: true },
  { id: 'opinion', name: 'Opinion', slug: 'opinion', directive: 'Editorials and opinion pieces', enabled: true },
];

/**
 * Inner payment form component - must be inside <Elements> to use Stripe hooks.
 * Handles: confirm payment → create tenant → create subscription → redirect.
 */
function AdminPaymentSection({
  formData,
  customerId,
  onError,
  onSuccess,
}: {
  formData: {
    businessName: string;
    domain: string;
    ownerEmail: string;
    city: string;
    county: string;
    state: string;
    planId: string;
  };
  customerId: string;
  onError: (msg: string) => void;
  onSuccess: (tenantId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const monthlyFee = PLAN_MONTHLY[formData.planId] || 99;
  const total = SETUP_FEE + monthlyFee;

  async function handleCreateAndCharge() {
    if (!stripe || !elements || !ready) return;

    setProcessing(true);
    onError('');

    try {
      // Step 1: Charge the card
      setStatus('Processing payment...');
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });

      if (paymentError) {
        onError(paymentError.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      // Step 2: Create the tenant
      setStatus('Creating newspaper...');
      const res = await fetch('/api/tenants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          ownerEmail: formData.ownerEmail,
          domain: formData.domain,
          serviceArea: {
            city: formData.city,
            state: formData.state,
            region: formData.county,
          },
          selectedCategories: DEFAULT_CATEGORIES,
          plan: formData.planId,
          stripeCustomerId: customerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        onError(data.error || 'Failed to create newspaper');
        setProcessing(false);
        return;
      }

      // Step 3: Create recurring subscription
      setStatus('Setting up monthly billing...');
      try {
        await fetch('/api/stripe/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            plan: formData.planId,
            tenantId: data.tenantId,
          }),
        });
      } catch (subError) {
        console.error('Subscription creation failed (non-fatal):', subError);
      }

      onSuccess(data.tenantId);
    } catch (err: any) {
      onError(err.message || 'Something went wrong');
      setProcessing(false);
    }
  }

  return (
    <div>
      {/* Charge summary */}
      <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Setup Fee (one-time)">${SETUP_FEE}</Descriptions.Item>
          <Descriptions.Item label={`${formData.planId.charAt(0).toUpperCase() + formData.planId.slice(1)} Plan (first month)`}>${monthlyFee}</Descriptions.Item>
        </Descriptions>
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: 16 }}>Total Due Today</Text>
          <Text strong style={{ fontSize: 16 }}>${total}</Text>
        </div>
      </Card>

      {/* Stripe card input */}
      <Card title={<Text strong><CreditCardOutlined /> Card Details</Text>} size="small" style={{ marginBottom: 16 }}>
        <PaymentElement onReady={() => setReady(true)} />
      </Card>

      {status && processing && (
        <Alert type="info" showIcon icon={<LoadingOutlined />} message={status} style={{ marginBottom: 16 }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button
          type="primary"
          size="large"
          onClick={handleCreateAndCharge}
          loading={processing}
          disabled={!stripe || !ready || processing}
          icon={processing ? <LoadingOutlined /> : <DollarOutlined />}
        >
          {processing ? status || 'Processing...' : `Charge $${total} & Create Newspaper`}
        </Button>
      </div>
    </div>
  );
}

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: '',
    domain: '',
    ownerEmail: '',
    city: '',
    county: '',
    state: '',
    planId: 'starter',
  });

  async function handleContinueToPayment() {
    // Validate
    if (!formData.businessName || !formData.domain || !formData.ownerEmail || !formData.city || !formData.state) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Create payment intent
      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: formData.planId,
          email: formData.ownerEmail,
          newspaperName: formData.businessName,
        }),
      });

      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setCustomerId(data.customerId);
        setStep('payment');
      } else {
        setError(data.error || 'Failed to initialize payment');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Add New Newspaper</Title>
            <Text type="secondary">
              {step === 'form' ? 'Fill in customer details' : 'Process payment & create newspaper'}
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step === 'payment' && (
              <Button icon={<ArrowLeftOutlined />} onClick={() => setStep('form')}>
                Back to Form
              </Button>
            )}
            <Link href="/admin/tenants">
              <Button icon={<ArrowLeftOutlined />}>Back to Tenants</Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert type="error" showIcon message={error} closable onClose={() => setError('')} />
        )}

        {/* Step 1: Form */}
        {step === 'form' && (
          <Form layout="vertical">
            {/* Newspaper Details */}
            <Card title={<Title level={4} style={{ margin: 0 }}>Newspaper Details</Title>} style={{ marginBottom: 16 }}>
              <Form.Item label={<Text strong>Newspaper Name</Text>} required>
                <Input
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Mountain View Times"
                  size="large"
                  required
                />
              </Form.Item>

              <Form.Item
                label={<Text strong>Domain</Text>}
                extra={<Text type="secondary" style={{ fontSize: 12 }}>The domain where this newspaper will be hosted</Text>}
                required
              >
                <Input
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="mountainviewtimes.com"
                  size="large"
                  required
                />
              </Form.Item>

              <Form.Item label={<Text strong>Owner Email</Text>} required>
                <Input
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  placeholder="owner@example.com"
                  size="large"
                  required
                />
              </Form.Item>
            </Card>

            {/* Service Area */}
            <Card title={<Title level={4} style={{ margin: 0 }}>Service Area</Title>} style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item label={<Text strong>City</Text>} required>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Mountain View"
                      size="large"
                      required
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label={<Text strong>County</Text>}
                    extra={<Text type="secondary" style={{ fontSize: 12 }}>Broadens news search coverage</Text>}
                    required
                  >
                    <Input
                      value={formData.county}
                      onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                      placeholder="Henderson County"
                      size="large"
                      required
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label={<Text strong>State</Text>} required>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="NC"
                      size="large"
                      required
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Subscription */}
            <Card title={<Title level={4} style={{ margin: 0 }}>Subscription</Title>} style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label={<Text strong>Plan</Text>}>
                    <Select
                      value={formData.planId}
                      onChange={(value) => setFormData({ ...formData, planId: value })}
                      size="large"
                      options={DEFAULT_PLANS.map((plan) => ({
                        value: plan.id,
                        label: `${plan.name} - $${plan.pricePerMonth}/mo (${plan.monthlyCredits.toLocaleString()} credits)`,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Info Card */}
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              message={<Text strong>What happens automatically?</Text>}
              description={
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>Tenant created with credits allocated</li>
                  <li>6 AI journalists auto-provisioned (one per category)</li>
                  <li>Content sources configured for their location</li>
                  <li>Master cron will start generating articles immediately</li>
                </ul>
              }
              style={{ marginBottom: 16 }}
            />

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Link href="/admin/tenants">
                <Button size="large">Cancel</Button>
              </Link>
              <Button
                type="primary"
                size="large"
                onClick={handleContinueToPayment}
                loading={loading}
                icon={loading ? <LoadingOutlined /> : <CreditCardOutlined />}
              >
                {loading ? 'Initializing...' : 'Continue to Payment'}
              </Button>
            </div>
          </Form>
        )}

        {/* Step 2: Payment */}
        {step === 'payment' && clientSecret && customerId && (
          <div>
            {/* Order summary */}
            <Card
              title={<Title level={4} style={{ margin: 0 }}>Order Summary</Title>}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Newspaper">{formData.businessName}</Descriptions.Item>
                <Descriptions.Item label="Owner">{formData.ownerEmail}</Descriptions.Item>
                <Descriptions.Item label="Location">{formData.city}, {formData.state}</Descriptions.Item>
                <Descriptions.Item label="Plan">{formData.planId.charAt(0).toUpperCase() + formData.planId.slice(1)}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: 'stripe' },
              }}
            >
              <AdminPaymentSection
                formData={formData}
                customerId={customerId}
                onError={setError}
                onSuccess={(tenantId) => router.push(`/admin/tenants/${tenantId}`)}
              />
            </Elements>
          </div>
        )}
      </Space>
    </div>
  );
}
