'use client';

import 'antd/dist/reset.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { DEFAULT_PLANS } from '@/types/credits';
import { createDefaultJournalists, createDefaultContentSources } from '@/types/aiJournalist';
import Link from 'next/link';
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
} from 'antd';
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const DEFAULT_CATEGORIES = [
  { id: 'local-news', name: 'Local News', slug: 'local-news', directive: 'Local community news and events', enabled: true },
  { id: 'sports', name: 'Sports', slug: 'sports', directive: 'Local sports coverage', enabled: true },
  { id: 'business', name: 'Business', slug: 'business', directive: 'Local business news and economy', enabled: true },
  { id: 'weather', name: 'Weather', slug: 'weather', directive: 'Weather forecasts and alerts', enabled: true },
  { id: 'community', name: 'Community', slug: 'community', directive: 'Community events and announcements', enabled: true },
  { id: 'opinion', name: 'Opinion', slug: 'opinion', directive: 'Editorials and opinion pieces', enabled: true },
];

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    domain: '',
    ownerEmail: '',
    city: '',
    state: '',
    planId: 'starter',
  });

  async function createTenant() {
    setError('');
    setLoading(true);

    try {
      const db = getDb();

      // Check if domain already exists
      const domainQuery = query(collection(db, 'tenants'), where('domain', '==', formData.domain));
      const domainSnap = await getDocs(domainQuery);
      if (!domainSnap.empty) {
        setError('A newspaper with this domain already exists');
        setLoading(false);
        return;
      }

      // Create slug from business name
      const slug = formData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Generate unique API key
      const apiKey = `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

      // Create tenant
      const tenantData: Omit<Tenant, 'id'> = {
        businessName: formData.businessName,
        slug,
        domain: formData.domain,
        ownerEmail: formData.ownerEmail,
        apiKey,
        serviceArea: {
          city: formData.city,
          state: formData.state,
        },
        categories: DEFAULT_CATEGORIES,
        status: 'provisioning',
        licensingStatus: 'active',
        createdAt: new Date(),
      };

      const tenantRef = await addDoc(collection(db, 'tenants'), tenantData);

      // Create credit allocation
      const plan = DEFAULT_PLANS.find((p) => p.id === formData.planId) || DEFAULT_PLANS[0];
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      await addDoc(collection(db, 'tenantCredits'), {
        tenantId: tenantRef.id,
        planId: plan.id,
        cycleStartDate: now,
        cycleEndDate: endOfMonth,
        monthlyAllocation: plan.monthlyCredits,
        creditsUsed: 0,
        creditsRemaining: plan.monthlyCredits,
        overageCredits: 0,
        softLimit: Math.floor(plan.monthlyCredits * 0.8),
        hardLimit: 0,
        status: 'active',
        softLimitWarned: false,
      });

      // Auto-provision AI journalists (one per category)
      const journalists = createDefaultJournalists(
        tenantRef.id,
        formData.businessName,
        DEFAULT_CATEGORIES
      );
      for (const journalist of journalists) {
        await addDoc(collection(db, 'aiJournalists'), journalist);
      }

      // Auto-provision content sources (local news feeds)
      const sources = createDefaultContentSources(tenantRef.id, formData.city, formData.state);
      for (const source of sources) {
        await addDoc(collection(db, 'contentSources'), source);
      }

      // Redirect to tenant detail page
      router.push(`/admin/tenants/${tenantRef.id}`);
    } catch (err: any) {
      console.error('Failed to create tenant:', err);
      setError(err.message || 'Failed to create newspaper');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Add New Newspaper</Title>
            <Text type="secondary">Provision a new tenant for the Paper Partner Program</Text>
          </div>
          <Link href="/admin/tenants">
            <Button icon={<ArrowLeftOutlined />}>Back</Button>
          </Link>
        </div>

        {error && (
          <Alert type="error" showIcon title={error} closable onClose={() => setError('')} />
        )}

        <Form layout="vertical" onFinish={createTenant}>
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
              <Col span={12}>
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
              <Col span={12}>
                <Form.Item label={<Text strong>State</Text>} required>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="CA"
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
              <Col span={12}>
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
            title={<Text strong>What happens automatically?</Text>}
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
              htmlType="submit"
              size="large"
              loading={loading}
              icon={loading ? <LoadingOutlined /> : <SaveOutlined />}
            >
              {loading ? 'Creating...' : 'Create Newspaper'}
            </Button>
          </div>
        </Form>
      </Space>
    </div>
  );
}
