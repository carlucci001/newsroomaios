'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { TenantCredits, CreditUsage, CreditTransaction, DEFAULT_PLANS } from '@/types/credits';
import Link from 'next/link';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  Input,
  Select,
  Tabs,
  Progress,
  Table,
  Empty,
  Spin,
  Space,
  Descriptions,
  Form,
  InputNumber,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  MailOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  DollarOutlined,
  RiseOutlined,
  WarningOutlined,
  SaveOutlined,
  LinkOutlined,
  SyncOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [credits, setCredits] = useState<TenantCredits | null>(null);
  const [usage, setUsage] = useState<CreditUsage[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingDomains, setSyncingDomains] = useState(false);
  const [domainActionLoading, setDomainActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Users tab state
  interface TenantUser {
    id: string;
    email: string;
    displayName?: string;
    role: string;
    status?: string;
    lastLoginAt?: any;
    createdAt?: any;
  }
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersFetched, setUsersFetched] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    businessName: '',
    domain: '',
    customDomain: '',
    ownerEmail: '',
    status: '',
    licensingStatus: '',
    softLimit: 0,
    hardLimit: 0,
  });

  useEffect(() => {
    fetchTenantData();
  }, [tenantId]);

  async function fetchTenantData() {
    try {
      const db = getDb();

      const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
      if (!tenantDoc.exists()) {
        router.push('/admin/tenants');
        return;
      }

      const tenantData = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;
      setTenant(tenantData);
      setEditForm({
        businessName: tenantData.businessName,
        domain: tenantData.domain,
        customDomain: tenantData.customDomain || '',
        ownerEmail: tenantData.ownerEmail,
        status: tenantData.status,
        licensingStatus: tenantData.licensingStatus,
        softLimit: 0,
        hardLimit: 0,
      });

      const creditsQuery = query(collection(db, 'tenantCredits'), where('tenantId', '==', tenantId));
      const usageQuery = query(
        collection(db, 'creditUsage'),
        where('tenantId', '==', tenantId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const txQuery = query(
        collection(db, 'creditTransactions'),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const [creditsSnap, usageSnap, txSnap] = await Promise.all([
        getDocs(creditsQuery),
        getDocs(usageQuery).catch(() => null),
        getDocs(txQuery).catch(() => null),
      ]);

      if (!creditsSnap.empty) {
        const creditData = { id: creditsSnap.docs[0].id, ...creditsSnap.docs[0].data() } as TenantCredits;
        setCredits(creditData);
        setEditForm((prev) => ({
          ...prev,
          softLimit: creditData.softLimit,
          hardLimit: creditData.hardLimit,
        }));
      }

      if (usageSnap) {
        setUsage(usageSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as CreditUsage[]);
      }

      if (txSnap) {
        setTransactions(txSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as CreditTransaction[]);
      }
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveTenant() {
    if (!tenant) return;

    setSaving(true);
    try {
      const db = getDb();

      const tenantUpdate: Record<string, any> = {
        businessName: editForm.businessName,
        domain: editForm.domain,
        ownerEmail: editForm.ownerEmail,
        status: editForm.status,
        licensingStatus: editForm.licensingStatus,
      };
      if (editForm.customDomain) {
        tenantUpdate.customDomain = editForm.customDomain;
        tenantUpdate.siteUrl = `https://${editForm.customDomain}`;
      }
      await updateDoc(doc(db, 'tenants', tenantId), tenantUpdate);

      if (credits) {
        await updateDoc(doc(db, 'tenantCredits', credits.id), {
          softLimit: editForm.softLimit,
          hardLimit: editForm.hardLimit,
        });
      }

      await fetchTenantData();
      message.success('Tenant settings saved');
    } catch (error) {
      console.error('Failed to save tenant:', error);
      message.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function allocateCredits() {
    if (!tenant) return;

    const plan = DEFAULT_PLANS.find((p) => p.id === (tenant as any).plan) || DEFAULT_PLANS[0];
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    try {
      const db = getDb();
      await addDoc(collection(db, 'tenantCredits'), {
        tenantId,
        planId: plan.id,
        cycleStartDate: now,
        cycleEndDate: nextBilling,
        monthlyAllocation: plan.monthlyCredits,
        creditsUsed: 0,
        creditsRemaining: plan.monthlyCredits,
        overageCredits: 0,
        softLimit: Math.floor(plan.monthlyCredits * 0.8),
        hardLimit: 0,
        status: 'active',
        softLimitWarned: false,
      });

      await fetchTenantData();
      message.success('Credits allocated');
    } catch (error) {
      console.error('Failed to allocate credits:', error);
      message.error('Failed to allocate credits');
    }
  }

  async function syncDomainsFromVercel() {
    setSyncingDomains(true);
    try {
      const res = await fetch(`/api/tenants/domains?tenantId=${tenantId}`);
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || 'Failed to fetch domains from Vercel');
        return;
      }
      if (data.customDomain) {
        setEditForm((prev) => ({ ...prev, customDomain: data.customDomain }));
        message.success(`Found custom domain: ${data.customDomain}`);
      } else {
        message.info('No custom domain found on Vercel — only subdomain detected');
      }
    } catch (error) {
      console.error('Failed to sync domains:', error);
      message.error('Failed to sync domains from Vercel');
    } finally {
      setSyncingDomains(false);
    }
  }

  async function handleDomainAction(action: 'approve' | 'reject') {
    setDomainActionLoading(true);
    try {
      const res = await fetch('/api/tenants/approve-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platform-Secret': process.env.NEXT_PUBLIC_PLATFORM_SECRET || '',
        },
        body: JSON.stringify({
          tenantId,
          action,
          rejectionReason: action === 'reject' ? rejectReason : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        message.success(action === 'approve' ? 'Domain approved and registered with Vercel' : 'Domain request rejected');
        setShowRejectInput(false);
        setRejectReason('');
        // Refresh tenant data
        const db = getDb();
        const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
        if (tenantDoc.exists()) {
          setTenant({ id: tenantDoc.id, ...tenantDoc.data() } as Tenant);
        }
      } else {
        message.error(data.error || 'Action failed');
      }
    } catch (error) {
      console.error('Domain action failed:', error);
      message.error('Failed to process domain action');
    } finally {
      setDomainActionLoading(false);
    }
  }

  async function fetchTenantUsers() {
    if (usersFetched) return;
    setUsersLoading(true);
    try {
      const db = getDb();
      const usersSnap = await getDocs(collection(db, `tenants/${tenantId}/users`));
      const users = usersSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as TenantUser[];
      setTenantUsers(users);
      setUsersFetched(true);
    } catch (error) {
      console.error('Failed to fetch tenant users:', error);
      message.error('Failed to load tenant users');
    } finally {
      setUsersLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    if (dateVal instanceof Date) return dateVal.toLocaleDateString();
    if (dateVal?.seconds) return new Date(dateVal.seconds * 1000).toLocaleDateString();
    if (dateVal?._seconds) return new Date(dateVal._seconds * 1000).toLocaleDateString();
    return new Date(dateVal).toLocaleDateString();
  };

  const formatTimestamp = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    if (dateVal instanceof Date) return dateVal.toLocaleString();
    if (dateVal?.seconds) return new Date(dateVal.seconds * 1000).toLocaleString();
    if (dateVal?._seconds) return new Date(dateVal._seconds * 1000).toLocaleString();
    return new Date(dateVal).toLocaleString();
  };

  const creditPercentage = credits
    ? Math.round((credits.creditsRemaining / credits.monthlyAllocation) * 100)
    : 0;

  const usageColumns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Text strong style={{ textTransform: 'capitalize' }}>{action.replace(/_/g, ' ')}</Text>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
    {
      title: 'Credits',
      dataIndex: 'creditsUsed',
      key: 'creditsUsed',
      align: 'right' as const,
      render: (val: number) => <Text strong style={{ color: '#ff4d4f' }}>-{val}</Text>,
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (val: any) => <Text type="secondary" style={{ fontSize: '12px' }}>{formatTimestamp(val)}</Text>,
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          {/* Info Card */}
          <Col xs={24} lg={16}>
            <Card title={<Title level={5} style={{ margin: 0 }}>Newspaper Information</Title>}>
              <Descriptions column={{ xs: 1, md: 2 }} size="middle">
                <Descriptions.Item label={<><MailOutlined /> Owner Email</>}>
                  {tenant.ownerEmail}
                </Descriptions.Item>
                <Descriptions.Item label={<><GlobalOutlined /> Domain</>}>
                  {tenant.domain}
                </Descriptions.Item>
                <Descriptions.Item label={<><EnvironmentOutlined /> Service Area</>}>
                  {tenant.serviceArea.city}, {tenant.serviceArea.state}
                  {tenant.serviceArea.region && ` (${tenant.serviceArea.region})`}
                </Descriptions.Item>
                <Descriptions.Item label={<><AppstoreOutlined /> Categories</>}>
                  {tenant.categories?.length || 0} configured
                </Descriptions.Item>
                <Descriptions.Item label={<><CalendarOutlined /> Created</>}>
                  {formatDate(tenant.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label={<><LinkOutlined /> Site URL</>}>
                  {tenant.siteUrl ? (
                    <a href={tenant.siteUrl} target="_blank" rel="noopener noreferrer">
                      {tenant.siteUrl}
                    </a>
                  ) : 'Not deployed'}
                </Descriptions.Item>
                {tenant.customDomain && (
                  <Descriptions.Item label={<><GlobalOutlined /> Custom Domain</>}>
                    <a href={`https://${tenant.customDomain}`} target="_blank" rel="noopener noreferrer">
                      {tenant.customDomain}
                    </a>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>

          {/* Credits Summary */}
          <Col xs={24} lg={8}>
            <Card title={<Title level={5} style={{ margin: 0 }}>Credit Balance</Title>}>
              {credits ? (
                <div style={{ textAlign: 'center' }}>
                  <Statistic
                    value={credits.creditsRemaining}
                    suffix={<Text type="secondary" style={{ fontSize: '14px' }}>remaining</Text>}
                    styles={{ content: { fontSize: '36px' } }}
                  />
                  <Progress
                    percent={creditPercentage}
                    strokeColor={
                      credits.status === 'exhausted' ? '#ff4d4f' :
                      credits.status === 'warning' ? '#faad14' :
                      '#52c41a'
                    }
                    style={{ marginTop: '16px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{credits.creditsUsed.toLocaleString()} used</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{credits.monthlyAllocation.toLocaleString()} total</Text>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <DollarOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <div><Text type="secondary">No credits allocated</Text></div>
                  <Button type="primary" onClick={allocateCredits} style={{ marginTop: '16px' }}>
                    Allocate Credits
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'credits',
      label: 'Credits & Usage',
      children: (
        <div style={{ marginTop: '16px' }}>
          {credits && (
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title={<Text strong style={{ fontSize: '14px' }}>Allocated</Text>}
                    value={credits.monthlyAllocation}
                    prefix={<DollarOutlined style={{ color: '#3b82f6' }} />}
                    styles={{ content: { fontSize: '28px' } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title={<Text strong style={{ fontSize: '14px' }}>Used</Text>}
                    value={credits.creditsUsed}
                    prefix={<RiseOutlined style={{ color: '#faad14' }} />}
                    styles={{ content: { fontSize: '28px' } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title={<Text strong style={{ fontSize: '14px' }}>Remaining</Text>}
                    value={credits.creditsRemaining}
                    prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                    styles={{ content: { fontSize: '28px' } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title={<Text strong style={{ fontSize: '14px' }}>Overage</Text>}
                    value={credits.overageCredits}
                    prefix={<WarningOutlined style={{ color: credits.overageCredits > 0 ? '#ff4d4f' : '#52c41a' }} />}
                    styles={{ content: { fontSize: '28px' } }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          <Card title={<Title level={5} style={{ margin: 0 }}>Recent Usage</Title>}>
            <Table
              columns={usageColumns}
              dataSource={usage.map((u) => ({ ...u, key: u.id }))}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: <Empty description="No usage recorded" /> }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'users',
      label: (
        <span>
          <UserOutlined style={{ marginRight: 8 }} />
          Users{usersFetched ? ` (${tenantUsers.length})` : ''}
        </span>
      ),
      children: (
        <Card title={<Title level={5} style={{ margin: 0 }}>Tenant Users</Title>} style={{ marginTop: '16px' }}>
          <Table
            columns={[
              {
                title: 'Name',
                dataIndex: 'displayName',
                key: 'displayName',
                render: (name: string, record: TenantUser) => (
                  <Text strong>{name || record.email?.split('@')[0] || 'Unknown'}</Text>
                ),
              },
              {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
                responsive: ['md'] as any[],
                render: (email: string) => <Text type="secondary">{email}</Text>,
              },
              {
                title: 'Role',
                dataIndex: 'role',
                key: 'role',
                render: (role: string) => {
                  const colors: Record<string, string> = {
                    owner: 'purple', admin: 'red', 'business-owner': 'orange',
                    'editor-in-chief': 'blue', editor: 'cyan', 'content-contributor': 'green',
                    reader: 'default', commenter: 'default',
                  };
                  return <Tag color={colors[role] || 'default'}>{(role || 'unknown').replace(/-/g, ' ').toUpperCase()}</Tag>;
                },
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                responsive: ['lg'] as any[],
                render: (status: string) => (
                  <Tag color={status === 'active' ? 'success' : status === 'blocked' ? 'error' : 'default'}>
                    {(status || 'unknown').toUpperCase()}
                  </Tag>
                ),
              },
              {
                title: 'Last Login',
                dataIndex: 'lastLoginAt',
                key: 'lastLoginAt',
                responsive: ['lg'] as any[],
                render: (val: any) => <Text type="secondary" style={{ fontSize: '12px' }}>{formatTimestamp(val)}</Text>,
              },
              {
                title: 'Action',
                key: 'action',
                render: (_: any, record: TenantUser) => {
                  const baseUrl = tenant.siteUrl || `https://${tenant.subdomain || tenant.slug + '.newsroomaios.com'}`;
                  return (
                    <Button
                      type="link"
                      icon={<UserSwitchOutlined />}
                      onClick={() => window.open(`${baseUrl}/admin?action=impersonate&userId=${record.id}`, '_blank')}
                    >
                      Impersonate
                    </Button>
                  );
                },
              },
            ]}
            dataSource={tenantUsers.map(u => ({ ...u, key: u.id }))}
            loading={usersLoading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 600 }}
            locale={{ emptyText: <Empty description="No users found for this tenant" /> }}
          />
        </Card>
      ),
    },
    {
      key: 'settings',
      label: 'Settings',
      children: (
        <>
          {/* Domain Request Review */}
          {tenant?.domainRequest && (
            <Card
              style={{
                marginTop: '16px',
                marginBottom: '16px',
                borderColor: tenant.domainRequest.status === 'pending' ? '#faad14' : tenant.domainRequest.status === 'approved' ? '#52c41a' : '#ff4d4f',
                borderWidth: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <GlobalOutlined style={{ fontSize: 20, color: tenant.domainRequest.status === 'pending' ? '#faad14' : tenant.domainRequest.status === 'approved' ? '#52c41a' : '#ff4d4f' }} />
                <div style={{ flex: 1 }}>
                  <Text strong>Domain Request: </Text>
                  <Text code>{tenant.domainRequest.domain}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Requested {new Date(tenant.domainRequest.requestedAt).toLocaleDateString()}
                    {tenant.domainRequest.reviewedAt && ` — Reviewed ${new Date(tenant.domainRequest.reviewedAt).toLocaleDateString()}`}
                  </Text>
                </div>
                <Tag color={tenant.domainRequest.status === 'pending' ? 'warning' : tenant.domainRequest.status === 'approved' ? 'success' : 'error'}>
                  {tenant.domainRequest.status.toUpperCase()}
                </Tag>
              </div>
              {tenant.domainRequest.status === 'pending' && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button
                    type="primary"
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    loading={domainActionLoading}
                    onClick={() => handleDomainAction('approve')}
                  >
                    Approve
                  </Button>
                  {!showRejectInput ? (
                    <Button danger onClick={() => setShowRejectInput(true)}>
                      Reject
                    </Button>
                  ) : (
                    <>
                      <Input
                        placeholder="Rejection reason..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        style={{ maxWidth: 300 }}
                      />
                      <Button
                        danger
                        loading={domainActionLoading}
                        onClick={() => handleDomainAction('reject')}
                      >
                        Confirm Reject
                      </Button>
                      <Button onClick={() => { setShowRejectInput(false); setRejectReason(''); }}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              )}
              {tenant.domainRequest.status === 'rejected' && tenant.domainRequest.rejectionReason && (
                <div style={{ marginTop: 8 }}>
                  <Text type="danger">Reason: {tenant.domainRequest.rejectionReason}</Text>
                </div>
              )}
            </Card>
          )}
        <Card title={<Title level={5} style={{ margin: 0 }}>Tenant Settings</Title>} style={{ marginTop: '16px' }}>
          <Form layout="vertical" style={{ maxWidth: '800px' }}>
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item label="Business Name">
                  <Input
                    value={editForm.businessName}
                    onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Domain">
                  <Input
                    value={editForm.domain}
                    onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Custom Domain" help="Live domain (e.g. atlanta-news.com). Also updates siteUrl.">
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      value={editForm.customDomain}
                      onChange={(e) => setEditForm({ ...editForm, customDomain: e.target.value })}
                      placeholder="e.g. mynewspaper.com"
                    />
                    <Button
                      icon={<SyncOutlined spin={syncingDomains} />}
                      onClick={syncDomainsFromVercel}
                      loading={syncingDomains}
                      title="Sync from Vercel"
                    >
                      Sync
                    </Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Owner Email">
                  <Input
                    type="email"
                    value={editForm.ownerEmail}
                    onChange={(e) => setEditForm({ ...editForm, ownerEmail: e.target.value })}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Status">
                  <Select
                    value={editForm.status}
                    onChange={(val) => setEditForm({ ...editForm, status: val })}
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'Provisioning', value: 'provisioning' },
                      { label: 'Seeding', value: 'seeding' },
                      { label: 'Suspended', value: 'suspended' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="License Status">
                  <Select
                    value={editForm.licensingStatus}
                    onChange={(val) => setEditForm({ ...editForm, licensingStatus: val })}
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'Past Due', value: 'past_due' },
                      { label: 'Canceled', value: 'canceled' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            {credits && (
              <>
                <Title level={5} style={{ marginTop: '24px' }}>Credit Limits</Title>
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Soft Limit (Warning)" help="Send warning when this usage is reached">
                      <InputNumber
                        value={editForm.softLimit}
                        onChange={(val) => setEditForm({ ...editForm, softLimit: val || 0 })}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Hard Limit (Stop)" help="Stop AI operations at this limit (0 = no limit)">
                      <InputNumber
                        value={editForm.hardLimit}
                        onChange={(val) => setEditForm({ ...editForm, hardLimit: val || 0 })}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #f0f0f0', paddingTop: '24px' }}>
              <Button onClick={() => router.push('/admin/tenants')}>
                Cancel
              </Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={saveTenant} loading={saving}>
                Save Changes
              </Button>
            </div>
          </Form>
        </Card>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Link href="/admin/tenants">
                <Button icon={<ArrowLeftOutlined />} type="text">Back</Button>
              </Link>
              <Title level={2} style={{ margin: 0 }}>{tenant.businessName}</Title>
            </div>
            <Space>
              <Text type="secondary">{tenant.domain}</Text>
              <Tag color={
                tenant.status === 'active' ? 'success' :
                tenant.status === 'suspended' ? 'error' :
                'warning'
              }>
                {tenant.status.toUpperCase()}
              </Tag>
              <Tag color={
                tenant.licensingStatus === 'active' ? 'success' :
                tenant.licensingStatus === 'past_due' ? 'error' :
                'default'
              }>
                {tenant.licensingStatus.toUpperCase()}
              </Tag>
            </Space>
          </div>
          {tenant.siteUrl && (
            <a href={tenant.siteUrl} target="_blank" rel="noopener noreferrer">
              <Button type="primary" icon={<GlobalOutlined />}>Visit Site</Button>
            </a>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          items={tabItems}
          size="large"
          onChange={(key) => {
            if (key === 'users' && !usersFetched) {
              fetchTenantUsers();
            }
          }}
        />
      </Space>
    </div>
  );
}
