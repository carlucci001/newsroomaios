'use client';

import 'antd/dist/reset.css';
import { useEffect, useState, useRef } from 'react';
import {
  Card,
  Typography,
  Select,
  Button,
  Space,
  Input,
  message,
  Segmented,
  Spin,
  Row,
  Col,
} from 'antd';
import {
  EyeOutlined,
  SendOutlined,
  FileTextOutlined,
  MailOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const TEMPLATES = [
  { value: 'welcome', label: 'Welcome Email' },
  { value: 'creditWarning', label: 'Credit Warning' },
  { value: 'paymentConfirmation', label: 'Payment Confirmation' },
  { value: 'paymentFailed', label: 'Payment Failed' },
  { value: 'newLead', label: 'New Lead Notification' },
  { value: 'newsletter', label: 'Newsletter Wrapper' },
  { value: 'planChange', label: 'Plan Change Confirmation' },
];

export default function EmailPreviewPage() {
  const [selected, setSelected] = useState('welcome');
  const [html, setHtml] = useState('');
  const [plainText, setPlainText] = useState('');
  const [viewMode, setViewMode] = useState<string>('HTML Preview');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState('carlfaring@gmail.com');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fetchTemplate = async (templateName: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/email-preview?template=${templateName}`);
      const data = await res.json();
      if (data.html) {
        setHtml(data.html);
        setPlainText(data.text || '');
      }
    } catch {
      message.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate(selected);
  }, [selected]);

  useEffect(() => {
    if (iframeRef.current && html && viewMode === 'HTML Preview') {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html, viewMode]);

  const handleSendTest = async () => {
    if (!testEmail) {
      message.warning('Enter an email address');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/admin/email-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: selected, sendTo: testEmail }),
      });
      const data = await res.json();
      if (data.success) {
        message.success(`Test email sent to ${testEmail}`);
      } else {
        message.error(data.error || 'Failed to send');
      }
    } catch {
      message.error('Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 4 }}>
        <MailOutlined style={{ marginRight: 8 }} />
        Email Template Preview
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Preview and test all branded email templates before sending to tenants.
      </Text>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card size="small" title="Template" style={{ marginBottom: 16 }}>
            <Select
              value={selected}
              onChange={setSelected}
              options={TEMPLATES}
              style={{ width: '100%', marginBottom: 16 }}
              size="large"
            />

            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as string)}
              options={[
                { label: 'HTML Preview', value: 'HTML Preview', icon: <EyeOutlined /> },
                { label: 'Plain Text', value: 'Plain Text', icon: <FileTextOutlined /> },
              ]}
              block
              style={{ marginBottom: 16 }}
            />
          </Card>

          <Card size="small" title="Send Test Email">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="recipient@example.com"
                prefix={<MailOutlined />}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendTest}
                loading={sending}
                block
              >
                Send Test
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            size="small"
            title={`Preview: ${TEMPLATES.find(t => t.value === selected)?.label}`}
            style={{ minHeight: 600 }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 80 }}>
                <Spin size="large" />
              </div>
            ) : viewMode === 'HTML Preview' ? (
              <iframe
                ref={iframeRef}
                title="Email Preview"
                style={{
                  width: '100%',
                  height: 700,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: '#f3f4f6',
                }}
              />
            ) : (
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  lineHeight: 1.6,
                  padding: 16,
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  maxHeight: 700,
                  overflow: 'auto',
                }}
              >
                {plainText}
              </pre>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
