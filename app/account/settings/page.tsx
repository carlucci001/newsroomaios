'use client';

import 'antd/dist/reset.css';
import { useState, useEffect } from 'react';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { getDb } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Button,
  Input,
  Space,
  Tag,
  Spin,
  Switch,
  message,
  Modal,
  Form,
  Divider,
} from 'antd';
import {
  ShopOutlined,
  GlobalOutlined,
  MailOutlined,
  LockOutlined,
  BellOutlined,
  WarningOutlined,
  SaveOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const { isDark } = useTheme();
  const [form] = Form.useForm();
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        setUser(currentUser);

        const userTenant = await getUserTenant(currentUser.uid);
        setTenant(userTenant);

        if (userTenant) {
          form.setFieldsValue({
            businessName: userTenant.businessName || '',
            contactEmail: userTenant.contactEmail || currentUser.email || '',
          });
          setEmailNotifications(userTenant.emailNotifications !== false);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [form]);

  const handleSaveSettings = async (values: { businessName: string; contactEmail: string }) => {
    if (!tenant?.id) return;

    setSaving(true);
    try {
      const db = getDb();
      await updateDoc(doc(db, 'tenants', tenant.id), {
        businessName: values.businessName.trim(),
        contactEmail: values.contactEmail.trim(),
        emailNotifications,
        updatedAt: new Date(),
      });

      // Update local state
      setTenant({
        ...tenant,
        businessName: values.businessName.trim(),
        contactEmail: values.contactEmail.trim(),
        emailNotifications,
      });

      message.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, user.email);
      message.success(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending password reset:', error);
      message.error('Failed to send password reset email. Please try again.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!tenant?.id) return;

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
        message.error(data.error || 'Could not open billing portal. Contact support.');
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      message.error('Failed to open billing portal. Please try again.');
    }

    setShowCancelModal(false);
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

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      <Space vertical size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Account Settings
          </Title>
          <Text type="secondary">
            Manage your newspaper and account preferences
          </Text>
        </div>

        {/* Business Information */}
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShopOutlined />
            <Title level={4} style={{ margin: 0 }}>Business Information</Title>
          </div>
        }>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Update your newspaper details and contact information
          </Text>

          <Form
            form={form}
            onFinish={handleSaveSettings}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              name="businessName"
              label={<Text strong>Business Name</Text>}
              rules={[{ required: true, message: 'Please enter your business name' }]}
            >
              <Input
                placeholder="Your Newspaper Name"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={<Text strong>Domain</Text>}
            >
              <Input
                prefix={<GlobalOutlined />}
                value={tenant.domain || 'N/A'}
                disabled
                size="large"
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Domain cannot be changed after setup
              </Text>
            </Form.Item>

            <Form.Item
              name="contactEmail"
              label={<Text strong>Contact Email</Text>}
              rules={[
                { required: true, message: 'Please enter a contact email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input
                type="email"
                placeholder="contact@yourdomain.com"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={<Text strong>Plan</Text>}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag color="blue" style={{ textTransform: 'capitalize', fontSize: '14px' }}>
                  {tenant.plan || 'Starter'} Plan
                </Tag>
                <Text type="secondary">
                  {tenant.plan === 'professional' ? '1,000' :
                   tenant.plan === 'growth' ? '575' : '250'} credits/month
                </Text>
              </div>
            </Form.Item>

            <Divider />

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
                size="large"
              >
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Account Security */}
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LockOutlined />
            <Title level={4} style={{ margin: 0 }}>Account Security</Title>
          </div>
        }>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Manage your login credentials
          </Text>

          <Space vertical size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Email Address</Text>
              <Input
                prefix={<MailOutlined />}
                value={user?.email || 'N/A'}
                disabled
                size="large"
              />
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Email address is managed through your authentication provider
              </Text>
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Password</Text>
              <Button
                onClick={handlePasswordReset}
                size="large"
              >
                Send Password Reset Email
              </Button>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                We'll send a password reset link to {user?.email}
              </Text>
            </div>
          </Space>
        </Card>

        {/* Notification Preferences */}
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BellOutlined />
            <Title level={4} style={{ margin: 0 }}>Notification Preferences</Title>
          </div>
        }>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Choose how you want to receive updates
          </Text>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <Text strong style={{ display: 'block' }}>Email Notifications</Text>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Receive updates about your account, credits, and billing
              </Text>
            </div>
            <Switch
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />
          </div>

          <Divider />

          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={saving}
            size="large"
          >
            Save Preferences
          </Button>
        </Card>

        {/* Danger Zone */}
        <Card
          style={{ borderColor: '#ff4d4f' }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <WarningOutlined style={{ color: '#ff4d4f' }} />
              <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>Danger Zone</Title>
            </div>
          }
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Irreversible actions for your account
          </Text>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Cancel Subscription</Text>
              <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>
                This will cancel your subscription and disable your newspaper
              </Text>
            </div>
            <Button
              danger
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Subscription
            </Button>
          </div>
        </Card>
      </Space>

      {/* Cancel Subscription Modal */}
      <Modal
        title={<Text strong style={{ color: '#ff4d4f' }}>Cancel Subscription?</Text>}
        open={showCancelModal}
        onCancel={() => setShowCancelModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowCancelModal(false)} size="large">
            Keep Subscription
          </Button>,
          <Button key="confirm" danger onClick={handleCancelSubscription} size="large">
            Yes, Cancel
          </Button>,
        ]}
      >
        <Space vertical size="small" style={{ width: '100%' }}>
          <Text>This action will:</Text>
          <ul style={{ paddingLeft: '24px', margin: '8px 0' }}>
            <li><Text>Stop your subscription at the end of the current billing period</Text></li>
            <li><Text>Disable access to your newspaper</Text></li>
            <li><Text>Prevent new content from being generated</Text></li>
            <li><Text>Your data will be preserved for 30 days</Text></li>
          </ul>
        </Space>
      </Modal>
    </div>
  );
}
