'use client';

import 'antd/dist/reset.css';
import { useEffect, useState, useRef } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Button,
  Input,
  Space,
  message,
  Spin,
  Row,
  Col,
  Segmented,
  Checkbox,
  Tag,
  Progress,
  Result,
  Alert,
} from 'antd';
import {
  SendOutlined,
  EyeOutlined,
  EditOutlined,
  MailOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const BETA_SLUGS = [
  'wnct-times',
  'hendo',
  'oceanside-news',
  'hardhatsports',
  'atlanta-news-network',
  'the42',
];

interface TenantRecipient {
  id: string;
  businessName: string;
  slug: string;
  ownerEmail: string;
  status: string;
}

type Scope = 'beta' | 'all';

interface SendResult {
  tenant: TenantRecipient;
  success: boolean;
  error?: string;
}

function bodyToHtml(text: string): string {
  return text
    .split('\n\n')
    .map(
      (para) =>
        `<p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.7;">${para.replace(/\n/g, '<br>')}</p>`
    )
    .join('');
}

export default function EmailBroadcastPage() {
  const { isDark } = useTheme();
  const [tenants, setTenants] = useState<TenantRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope>('beta');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [viewMode, setViewMode] = useState<string>('Compose');
  const [previewHtml, setPreviewHtml] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      const db = getDb();
      const q = query(collection(db, 'tenants'), orderBy('businessName', 'asc'));
      const snap = await getDocs(q);
      const all = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            businessName: data.businessName || data.slug || d.id,
            slug: data.slug || '',
            ownerEmail: data.ownerEmail || '',
            status: data.status || '',
          } as TenantRecipient;
        })
        .filter((t) => t.status === 'active' && t.ownerEmail);
      setTenants(all);

      // Default select beta tenants
      const betaIds = new Set(
        all.filter((t) => BETA_SLUGS.includes(t.slug)).map((t) => t.id)
      );
      setSelected(betaIds);
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      message.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }

  const filteredTenants =
    scope === 'beta'
      ? tenants.filter((t) => BETA_SLUGS.includes(t.slug))
      : tenants;

  // When scope changes, update selection to match
  useEffect(() => {
    const ids = new Set(filteredTenants.map((t) => t.id));
    setSelected(ids);
  }, [scope, tenants]);

  function toggleTenant(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelected(new Set(filteredTenants.map((t) => t.id)));
    } else {
      setSelected(new Set());
    }
  }

  const recipients = filteredTenants.filter((t) => selected.has(t.id));

  function handlePreview() {
    if (!subject || !body) {
      message.warning('Enter a subject and message body');
      return;
    }
    const htmlContent = `
      <h2 style="margin: 0 0 8px 0; color: #1e3a5f; font-size: 22px; font-weight: 700;">
        ${subject}
      </h2>
      <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 13px;">
        To: ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}
      </p>
      ${bodyToHtml(body)}
    `;
    setPreviewHtml(htmlContent);
    setViewMode('Preview');
  }

  useEffect(() => {
    if (iframeRef.current && previewHtml && viewMode === 'Preview') {
      const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
<tr><td align="center" style="padding: 40px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background-color: #ffffff; padding: 32px 40px 20px 40px; text-align: center; border-bottom: 3px solid #2563eb;">
<div style="font-size: 28px; font-weight: 800; color: #1e3a5f; letter-spacing: -0.5px;">Newsroom AIOS</div>
</td></tr>
<tr><td style="padding: 40px; color: #1f2937; font-size: 15px; line-height: 1.7;">
${previewHtml}
</td></tr>
<tr><td style="padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
<p style="margin: 0; color: #9ca3af; font-size: 12px;">Newsroom AIOS — A service of Farrington Development</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(fullHtml);
        doc.close();
      }
    }
  }, [previewHtml, viewMode]);

  async function handleSend() {
    if (!subject || !body) {
      message.warning('Enter a subject and message body');
      return;
    }
    if (recipients.length === 0) {
      message.warning('Select at least one recipient');
      return;
    }

    setSending(true);
    setSendProgress(0);
    setSendResults(null);

    const results: SendResult[] = [];
    const htmlBody = bodyToHtml(body);

    for (let i = 0; i < recipients.length; i++) {
      const tenant = recipients[i];
      try {
        const res = await fetch('/api/admin/send-tenant-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: tenant.ownerEmail,
            subject,
            bodyHtml: htmlBody,
          }),
        });
        const data = await res.json();
        results.push({
          tenant,
          success: !!data.success,
          error: data.error,
        });
      } catch (err: any) {
        results.push({
          tenant,
          success: false,
          error: err.message || 'Network error',
        });
      }
      setSendProgress(Math.round(((i + 1) / recipients.length) * 100));
    }

    setSendResults(results);
    setSending(false);

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    if (failed === 0) {
      message.success(`Sent to all ${succeeded} recipients`);
    } else {
      message.warning(`${succeeded} sent, ${failed} failed`);
    }
  }

  function handleReset() {
    setSendResults(null);
    setSubject('');
    setBody('');
    setViewMode('Compose');
    setPreviewHtml('');
    setSendProgress(0);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  // Results view
  if (sendResults) {
    const succeeded = sendResults.filter((r) => r.success);
    const failed = sendResults.filter((r) => !r.success);
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <Result
          status={failed.length === 0 ? 'success' : 'warning'}
          title={`Broadcast Complete: ${succeeded.length}/${sendResults.length} Sent`}
          subTitle={`Subject: "${subject}"`}
          extra={[
            <Button key="another" type="primary" onClick={handleReset}>
              Send Another Broadcast
            </Button>,
          ]}
        />
        {failed.length > 0 && (
          <Card title="Failed Recipients" size="small" style={{ marginTop: 16 }}>
            {failed.map((r) => (
              <div key={r.tenant.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>{r.tenant.businessName}</Text>{' '}
                <Text type="secondary">({r.tenant.ownerEmail})</Text>
                <br />
                <Text type="danger" style={{ fontSize: 12 }}>{r.error}</Text>
              </div>
            ))}
          </Card>
        )}
        {succeeded.length > 0 && (
          <Card title="Delivered" size="small" style={{ marginTop: 16 }}>
            {succeeded.map((r) => (
              <div key={r.tenant.id} style={{ padding: '4px 0' }}>
                <CheckCircleOutlined style={{ color: '#22c55e', marginRight: 8 }} />
                <Text>{r.tenant.businessName}</Text>{' '}
                <Text type="secondary">({r.tenant.ownerEmail})</Text>
              </div>
            ))}
          </Card>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 4 }}>
        <SendOutlined style={{ marginRight: 8 }} />
        Email Broadcast
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Send a branded email to multiple tenants at once.
      </Text>

      <Row gutter={[16, 16]}>
        {/* Left: Recipients */}
        <Col xs={24} md={8}>
          <Card
            size="small"
            title={
              <Space>
                <TeamOutlined />
                <span>Recipients</span>
                <Tag color="blue">{recipients.length}</Tag>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Segmented
              value={scope}
              onChange={(val) => setScope(val as Scope)}
              options={[
                { label: `Beta (${tenants.filter((t) => BETA_SLUGS.includes(t.slug)).length})`, value: 'beta' },
                { label: `All Active (${tenants.length})`, value: 'all' },
              ]}
              block
              style={{ marginBottom: 12 }}
            />
            <Alert
              message="Sends to paper owner"
              description="Each email goes to the owner email on file for the selected papers."
              type="info"
              showIcon
              style={{ marginBottom: 12, fontSize: 12 }}
            />
            <div style={{ marginBottom: 8 }}>
              <Checkbox
                checked={selected.size === filteredTenants.length && filteredTenants.length > 0}
                indeterminate={selected.size > 0 && selected.size < filteredTenants.length}
                onChange={(e) => toggleAll(e.target.checked)}
              >
                <Text strong style={{ fontSize: 12 }}>Select All</Text>
              </Checkbox>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {filteredTenants.map((t) => (
                <div key={t.id} style={{ padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <Checkbox
                    checked={selected.has(t.id)}
                    onChange={() => toggleTenant(t.id)}
                  >
                    <Text style={{ fontSize: 13 }}>{t.businessName}</Text>
                    <Tag style={{ marginLeft: 6, fontSize: 10 }}>Owner</Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>{t.ownerEmail}</Text>
                  </Checkbox>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Right: Compose / Preview */}
        <Col xs={24} md={16}>
          <Card size="small">
            <Segmented
              value={viewMode}
              onChange={(val) => {
                if (val === 'Preview') handlePreview();
                else setViewMode(val as string);
              }}
              options={[
                { label: 'Compose', value: 'Compose', icon: <EditOutlined /> },
                { label: 'Preview', value: 'Preview', icon: <EyeOutlined /> },
              ]}
              style={{ marginBottom: 16 }}
            />

            {viewMode === 'Compose' ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>Subject</Text>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Platform Update: New Features Available"
                    size="large"
                  />
                </div>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>Message</Text>
                  <TextArea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your message here. Use blank lines to separate paragraphs."
                    rows={14}
                    style={{ fontSize: 14 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    Your message will be wrapped in the branded Newsroom AIOS email template.
                  </Text>
                </div>

                {sending && (
                  <Progress percent={sendProgress} status="active" />
                )}

                <Space>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={handlePreview}
                    disabled={!subject || !body}
                  >
                    Preview
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={sending}
                    disabled={!subject || !body || recipients.length === 0}
                  >
                    {sending
                      ? `Sending...`
                      : `Send to ${recipients.length} Recipient${recipients.length !== 1 ? 's' : ''}`}
                  </Button>
                </Space>
              </Space>
            ) : (
              <div>
                <iframe
                  ref={iframeRef}
                  title="Email Preview"
                  style={{
                    width: '100%',
                    height: 550,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#f3f4f6',
                  }}
                />
                <Space style={{ marginTop: 16 }}>
                  <Button icon={<EditOutlined />} onClick={() => setViewMode('Compose')}>
                    Edit
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={sending}
                    disabled={recipients.length === 0}
                  >
                    {sending
                      ? `Sending...`
                      : `Send to ${recipients.length} Recipient${recipients.length !== 1 ? 's' : ''}`}
                  </Button>
                </Space>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
