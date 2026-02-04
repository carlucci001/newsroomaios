'use client';

import 'antd/dist/reset.css';
import { Card, Typography, Button, Tag, Row, Col, Space, Divider } from 'antd';
import {
  CreditCardOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    credits: 250,
    articles: 50,
    journalists: 1,
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
    articles: 115,
    journalists: 3,
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
    articles: 200,
    journalists: 6,
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

export default function BillingAntPage() {
  const currentPlan = PLANS[1]; // Growth plan for demo
  const isActive = true;

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
              <Tag color="success" style={{ fontSize: '14px', padding: '4px 12px' }}>
                {isActive ? 'Active' : 'Inactive'}
              </Tag>
            </div>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '16px 0' }} />

            <Row gutter={24}>
              <Col span={8}>
                <CalendarOutlined style={{ fontSize: '20px', color: 'white', marginBottom: '8px' }} />
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', display: 'block', fontSize: '12px' }}>
                    Next Billing
                  </Text>
                  <Text strong style={{ color: 'white', fontSize: '16px' }}>
                    3/5/2026
                  </Text>
                </div>
              </Col>
              <Col span={8}>
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
              <Col span={8}>
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
          <Space>
            <Button type="primary" icon={<CreditCardOutlined />} size="large">
              Manage Payment Method
            </Button>
            <Button danger size="large">
              Cancel Subscription
            </Button>
          </Space>
        </Card>

        {/* Available Plans */}
        <div>
          <Title level={3} style={{ marginBottom: '16px' }}>
            Available Plans
          </Title>
          <Row gutter={[16, 16]}>
            {PLANS.map((plan) => (
              <Col xs={24} md={8} key={plan.id}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    border: plan.id === 'growth' ? '2px solid #1890ff' : '1px solid #d9d9d9',
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

                    {plan.id === currentPlan.id ? (
                      <Button block disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button type="primary" block size="large">
                        {PLANS.findIndex((p) => p.id === currentPlan.id) <
                        PLANS.findIndex((p) => p.id === plan.id)
                          ? 'Upgrade'
                          : 'Downgrade'}
                      </Button>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Billing History */}
        <Card title="Billing History">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">No invoices yet. Your first invoice will appear here after billing.</Text>
          </div>
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
              <Button type="primary">Contact Support</Button>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
}
