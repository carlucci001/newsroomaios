'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { DEFAULT_PLANS, CreditPlan } from '@/types/credits';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Button,
  Input,
  Space,
  Tabs,
  Switch,
  Select,
  InputNumber,
  Row,
  Col,
  Spin,
  message,
  Alert,
} from 'antd';
import {
  SettingOutlined,
  MailOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  GithubOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultTrialDays: number;
  defaultPlanId: string;
  stripeEnabled: boolean;
  stripePublishableKey?: string;
  gitHubRepo: string;
  gitHubToken?: string;
  notificationEmail: string;
  maintenanceMode?: boolean;
}

const defaultSettings: PlatformSettings = {
  platformName: 'Newsroom AIOS',
  supportEmail: 'support@newsroomaios.com',
  defaultTrialDays: 14,
  defaultPlanId: 'starter',
  stripeEnabled: false,
  gitHubRepo: 'carlucci001/wnct-next',
  notificationEmail: '',
  maintenanceMode: false,
};

export default function SettingsPage() {
  const { isDark } = useTheme();
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [plans, setPlans] = useState<CreditPlan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const db = getDb();
      const settingsDoc = await getDoc(doc(db, 'settings', 'platform'));

      if (settingsDoc.exists()) {
        setSettings({ ...defaultSettings, ...settingsDoc.data() } as PlatformSettings);
      }

      const plansDoc = await getDoc(doc(db, 'settings', 'plans'));
      if (plansDoc.exists()) {
        setPlans(plansDoc.data().plans as CreditPlan[]);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const db = getDb();
      await setDoc(doc(db, 'settings', 'platform'), settings);
      message.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function savePlans() {
    setSaving(true);
    try {
      const db = getDb();
      await setDoc(doc(db, 'settings', 'plans'), { plans });
      message.success('Plans saved successfully');
    } catch (error) {
      console.error('Failed to save plans:', error);
      message.error('Failed to save plans');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'maintenance',
      label: (
        <span>
          <ToolOutlined /> Maintenance
        </span>
      ),
      children: (
        <Space vertical size="large" style={{ width: '100%' }}>
          <Alert
            message="Maintenance Mode Control"
            description="When enabled, the public site will show a maintenance page. Admin routes will remain accessible."
            type="info"
            showIcon
          />

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  padding: '12px',
                  background: settings.maintenanceMode ? '#fff2e8' : '#f0f5ff',
                  borderRadius: '8px'
                }}>
                  {settings.maintenanceMode ? (
                    <WarningOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
                  ) : (
                    <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                  )}
                </div>
                <div>
                  <Text strong style={{ display: 'block', fontSize: '16px' }}>
                    {settings.maintenanceMode ? 'Site is in Maintenance Mode' : 'Site is Online'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {settings.maintenanceMode
                      ? 'Public visitors see the maintenance page'
                      : 'Public site is accessible to all visitors'}
                  </Text>
                </div>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
          </Card>

          {settings.maintenanceMode && (
            <Alert
              message="Maintenance Mode Active"
              description="The public site is currently showing the maintenance page. Admin users can still access /admin routes."
              type="warning"
              showIcon
              icon={<WarningOutlined />}
            />
          )}

          <Card>
            <Space vertical size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>About Maintenance Mode</Text>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li><Text type="secondary">Public site displays a professional maintenance page</Text></li>
                  <li><Text type="secondary">Admin routes (/admin/*) remain fully accessible</Text></li>
                  <li><Text type="secondary">API routes continue to function normally</Text></li>
                  <li><Text type="secondary">Changes take effect immediately after saving</Text></li>
                  <li><Text type="secondary">Environment variable (NEXT_PUBLIC_MAINTENANCE_MODE) takes priority if set</Text></li>
                </ul>
              </div>
            </Space>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #d9d9d9' }}>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={saveSettings}
              loading={saving}
              danger={settings.maintenanceMode}
            >
              {settings.maintenanceMode ? 'Enable Maintenance Mode' : 'Save Changes'}
            </Button>
          </div>
        </Space>
      ),
    },
    {
      key: 'general',
      label: (
        <span>
          <SettingOutlined /> General
        </span>
      ),
      children: (
        <Space vertical size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Space vertical size="small" style={{ width: '100%' }}>
                <Text strong>
                  <SettingOutlined style={{ marginRight: '8px' }} />
                  Platform Name
                </Text>
                <Input
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  size="large"
                />
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space vertical size="small" style={{ width: '100%' }}>
                <Text strong>
                  <MailOutlined style={{ marginRight: '8px' }} />
                  Support Email
                </Text>
                <Input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  size="large"
                />
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space vertical size="small" style={{ width: '100%' }}>
                <Text strong>
                  <ClockCircleOutlined style={{ marginRight: '8px' }} />
                  Default Trial Period (days)
                </Text>
                <InputNumber
                  value={settings.defaultTrialDays}
                  onChange={(value) => setSettings({ ...settings, defaultTrialDays: value || 14 })}
                  size="large"
                  style={{ width: '100%' }}
                  min={1}
                />
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space vertical size="small" style={{ width: '100%' }}>
                <Text strong>
                  <MailOutlined style={{ marginRight: '8px' }} />
                  Admin Notification Email
                </Text>
                <Input
                  type="email"
                  value={settings.notificationEmail}
                  onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                  placeholder="Receive notifications for new signups, etc."
                  size="large"
                />
              </Space>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #d9d9d9' }}>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={saveSettings}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </Space>
      ),
    },
    {
      key: 'billing',
      label: (
        <span>
          <CreditCardOutlined /> Billing
        </span>
      ),
      children: (
        <Space vertical size="large" style={{ width: '100%' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ padding: '8px', background: '#e6f7ff', borderRadius: '8px' }}>
                  <CreditCardOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                </div>
                <div>
                  <Text strong style={{ display: 'block' }}>Stripe Integration</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Enable payment processing with Stripe</Text>
                </div>
              </div>
              <Switch
                checked={settings.stripeEnabled}
                onChange={(checked) => setSettings({ ...settings, stripeEnabled: checked })}
              />
            </div>
          </Card>

          {settings.stripeEnabled && (
            <Card>
              <Space vertical size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>Stripe Publishable Key</Text>
                  <Input
                    value={settings.stripePublishableKey || ''}
                    onChange={(e) => setSettings({ ...settings, stripePublishableKey: e.target.value })}
                    placeholder="pk_test_..."
                    size="large"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
                <Alert
                  message="Note: The secret key should be set as an environment variable (STRIPE_SECRET_KEY), not stored in the database."
                  type="warning"
                  showIcon
                />
              </Space>
            </Card>
          )}

          <Space vertical size="small" style={{ width: '100%' }}>
            <Text strong>Default Plan for New Tenants</Text>
            <Select
              value={settings.defaultPlanId}
              onChange={(value) => setSettings({ ...settings, defaultPlanId: value })}
              size="large"
              style={{ width: '100%' }}
            >
              {plans.map((plan) => (
                <Select.Option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.pricePerMonth}/mo ({plan.monthlyCredits.toLocaleString()} credits)
                </Select.Option>
              ))}
            </Select>
          </Space>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #d9d9d9' }}>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={saveSettings}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </Space>
      ),
    },
    {
      key: 'integrations',
      label: (
        <span>
          <GithubOutlined /> Integrations
        </span>
      ),
      children: (
        <Space vertical size="large" style={{ width: '100%' }}>
          <Card>
            <Space vertical size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1f2328', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GithubOutlined style={{ fontSize: '20px', color: 'white' }} />
                </div>
                <div>
                  <Text strong style={{ display: 'block' }}>GitHub</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Template repository for tenant deployments</Text>
                </div>
              </div>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Template Repository</Text>
                <Input
                  value={settings.gitHubRepo}
                  onChange={(e) => setSettings({ ...settings, gitHubRepo: e.target.value })}
                  placeholder="owner/repo"
                  size="large"
                />
              </div>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>GitHub Personal Access Token</Text>
                <Input.Password
                  value={settings.gitHubToken || ''}
                  onChange={(e) => setSettings({ ...settings, gitHubToken: e.target.value })}
                  placeholder="ghp_..."
                  size="large"
                  style={{ fontFamily: 'monospace' }}
                />
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Requires repo and workflow scopes for deployment automation
                </Text>
              </div>
            </Space>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #d9d9d9' }}>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={saveSettings}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </Space>
      ),
    },
    {
      key: 'plans',
      label: (
        <span>
          <DollarOutlined /> Credit Plans
        </span>
      ),
      children: (
        <Space vertical size="large" style={{ width: '100%' }}>
          <Text type="secondary">
            Configure credit plans available to tenants. Changes will apply to new subscriptions.
          </Text>

          <Row gutter={[16, 16]}>
            {plans.map((plan, index) => (
              <Col xs={24} lg={8} key={plan.id}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text strong>{plan.name}</Text>
                      {index === 1 && (
                        <span style={{ fontSize: '12px', padding: '2px 8px', background: '#1890ff', color: 'white', borderRadius: '4px' }}>
                          Popular
                        </span>
                      )}
                    </div>
                  }
                >
                  <Space vertical size="middle" style={{ width: '100%' }}>
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: '8px' }}>Plan Name</Text>
                      <Input
                        value={plan.name}
                        onChange={(e) => {
                          const updated = [...plans];
                          updated[index] = { ...plan, name: e.target.value };
                          setPlans(updated);
                        }}
                      />
                    </div>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Monthly Price ($)</Text>
                        <InputNumber
                          value={plan.pricePerMonth}
                          onChange={(value) => {
                            const updated = [...plans];
                            updated[index] = { ...plan, pricePerMonth: value || 0 };
                            setPlans(updated);
                          }}
                          style={{ width: '100%' }}
                          min={0}
                        />
                      </Col>
                      <Col span={12}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Monthly Credits</Text>
                        <InputNumber
                          value={plan.monthlyCredits}
                          onChange={(value) => {
                            const updated = [...plans];
                            updated[index] = { ...plan, monthlyCredits: value || 0 };
                            setPlans(updated);
                          }}
                          style={{ width: '100%' }}
                          min={0}
                        />
                      </Col>
                    </Row>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Max AI Journalists</Text>
                        <InputNumber
                          value={plan.maxAIJournalists}
                          onChange={(value) => {
                            const updated = [...plans];
                            updated[index] = { ...plan, maxAIJournalists: value || 0 };
                            setPlans(updated);
                          }}
                          style={{ width: '100%' }}
                        />
                        <Text type="secondary" style={{ fontSize: '11px' }}>-1 = unlimited</Text>
                      </Col>
                      <Col span={12}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Overage Rate ($)</Text>
                        <InputNumber
                          value={plan.pricePerCredit}
                          onChange={(value) => {
                            const updated = [...plans];
                            updated[index] = { ...plan, pricePerCredit: value || 0 };
                            setPlans(updated);
                          }}
                          style={{ width: '100%' }}
                          step={0.01}
                          min={0}
                        />
                        <Text type="secondary" style={{ fontSize: '11px' }}>Per credit</Text>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #d9d9d9' }}>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={savePlans}
              loading={saving}
            >
              Save Plans
            </Button>
          </div>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      <Space vertical size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Platform Settings</Title>
          <Text type="secondary">Configure platform-wide settings and integrations</Text>
        </div>

        <Card>
          <Tabs items={tabItems} size="large" />
        </Card>
      </Space>
    </div>
  );
}
