'use client';

import 'antd/dist/reset.css';
import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Row,
  Col,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const CREDIT_PACKAGES = [
  {
    id: 'credits_100',
    credits: 100,
    price: 19,
    priceId: 'price_credits_100',
    popular: false,
  },
  {
    id: 'credits_250',
    credits: 250,
    price: 45,
    priceId: 'price_credits_250',
    popular: true,
    savings: '5%',
  },
  {
    id: 'credits_500',
    credits: 500,
    price: 85,
    priceId: 'price_credits_500',
    popular: false,
    savings: '10%',
  },
  {
    id: 'credits_1000',
    credits: 1000,
    price: 150,
    priceId: 'price_credits_1000',
    popular: false,
    savings: '21%',
  },
];

export default function PurchaseCreditsPage() {
  const { isDark } = useTheme();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (packageId: string, priceId: string) => {
    setPurchasing(packageId);

    try {
      // TODO: Implement Stripe checkout for one-time credit purchase
      message.info('Credit purchase coming soon! This will create a Stripe checkout session.');
    } catch (error) {
      console.error('Purchase error:', error);
      message.error('Failed to initiate purchase. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

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
                  onClick={() => handlePurchase(pkg.id, pkg.priceId)}
                  loading={purchasing === pkg.id}
                  disabled={purchasing !== null && purchasing !== pkg.id}
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
    </div>
  );
}
