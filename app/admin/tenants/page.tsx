'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { TenantCredits, DEFAULT_PLANS } from '@/types/credits';
import { useTheme } from '@/components/providers/AntdProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Input,
  Space,
  Dropdown,
  Modal,
  Progress,
  Alert,
} from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MessageOutlined,
  DollarOutlined,
  GlobalOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

type TenantWithCredits = Tenant & { credits?: TenantCredits };

interface TableDataType {
  key: string;
  id: string;
  businessName: string;
  domain: string;
  status: string;
  licensingStatus: string;
  ownerEmail: string;
  creditsRemaining: number;
  monthlyAllocation: number;
  plan?: string;
  lastRolloutVersion?: string;
  lastRolloutAt?: any;
  lastLogin?: any;
}

export default function TenantsPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantWithCredits[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      const db = getDb();

      const tenantsQuery = query(collection(db, 'tenants'), orderBy('createdAt', 'desc'));
      const tenantsSnap = await getDocs(tenantsQuery);
      const tenantsData = tenantsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tenant[];

      const creditsSnap = await getDocs(collection(db, 'tenantCredits'));
      const creditsMap = new Map<string, TenantCredits>();
      creditsSnap.docs.forEach((docSnap) => {
        const data = docSnap.data() as Omit<TenantCredits, 'id'>;
        creditsMap.set(data.tenantId, { ...data, id: docSnap.id });
      });

      const merged = tenantsData.map((tenant) => ({
        ...tenant,
        credits: creditsMap.get(tenant.id),
      }));

      setTenants(merged);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const platformVersion = process.env.NEXT_PUBLIC_PLATFORM_VERSION || '';
  const staleTenants = tenants.filter(
    (t) => t.status === 'active' && (t as any).lastRolloutVersion && platformVersion && (t as any).lastRolloutVersion !== `v${platformVersion}` && (t as any).lastRolloutVersion !== platformVersion
  );

  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === 'active').length,
    deployed: tenants.filter((t) => t.status === 'active' && (t as any).siteUrl).length,
    suspended: tenants.filter((t) => t.status === 'suspended').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'processing';
      case 'suspended': return 'error';
      case 'seeding': return 'warning';
      case 'provisioning': return 'warning';
      default: return 'default';
    }
  };

  const getLicenseColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'processing';
      case 'suspended': return 'error';
      case 'past_due': return 'error';
      case 'canceled': return 'default';
      default: return 'default';
    }
  };

  const getActionMenu = (tenant: TenantWithCredits): MenuProps => ({
    items: [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details',
        onClick: () => router.push(`/admin/tenants/${tenant.id}`),
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit Tenant',
        onClick: () => router.push(`/admin/tenants/${tenant.id}`),
      },
      {
        key: 'credits',
        icon: <DollarOutlined />,
        label: 'Manage Credits',
        onClick: () => router.push(`/admin/credits?tenant=${tenant.id}`),
      },
      {
        key: 'message',
        icon: <MessageOutlined />,
        label: 'Send Message',
        onClick: () => router.push(`/admin/tenants/${tenant.id}/email`),
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete',
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: 'Delete Tenant',
            content: `Are you sure you want to delete ${tenant.businessName}?`,
            okText: 'Delete',
            okType: 'danger',
            onOk: () => console.log('Delete:', tenant.id),
          });
        },
      },
    ],
  });

  const columns: TableColumnsType<TableDataType> = [
    {
      title: <Text strong>Business Name</Text>,
      dataIndex: 'businessName',
      key: 'businessName',
      sorter: (a, b) => a.businessName.localeCompare(b.businessName),
      render: (text: string, record) => (
        <div>
          <Link href={`/admin/tenants/${record.id}`}>
            <Text strong>{text}</Text>
          </Link>
          <div style={{ marginTop: '4px' }}>
            <GlobalOutlined style={{ fontSize: '12px', marginRight: '4px', opacity: 0.6 }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.domain}</Text>
          </div>
        </div>
      ),
    },
    {
      title: <Text strong>Status</Text>,
      dataIndex: 'status',
      key: 'status',
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Suspended', value: 'suspended' },
        { text: 'Provisioning', value: 'provisioning' },
        { text: 'Seeding', value: 'seeding' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: <Text strong>License</Text>,
      dataIndex: 'licensingStatus',
      key: 'licensingStatus',
      sorter: (a, b) => a.licensingStatus.localeCompare(b.licensingStatus),
      render: (status: string) => (
        <Tag color={getLicenseColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: <Text strong>Plan</Text>,
      dataIndex: 'plan',
      key: 'plan',
      width: 130,
      filters: DEFAULT_PLANS.map((p) => ({ text: p.name, value: p.id })),
      onFilter: (value, record) => (record.plan || 'starter') === value,
      render: (plan: string) => {
        const planDef = DEFAULT_PLANS.find((p) => p.id === (plan || 'starter')) || DEFAULT_PLANS[0];
        const colors: Record<string, string> = { starter: 'default', growth: 'blue', professional: 'purple' };
        return (
          <div>
            <Tag color={colors[planDef.id] || 'default'}>{planDef.name}</Tag>
            <div style={{ marginTop: '2px' }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>${planDef.pricePerMonth}/mo</Text>
            </div>
          </div>
        );
      },
    },
    {
      title: <Text strong>Credits</Text>,
      key: 'credits',
      sorter: (a, b) => a.creditsRemaining - b.creditsRemaining,
      render: (_, record) => {
        const percentage = record.monthlyAllocation > 0
          ? Math.round((record.creditsRemaining / record.monthlyAllocation) * 100)
          : 0;
        const status = percentage < 10 ? 'exception' : percentage < 30 ? 'normal' : 'success';

        return (
          <div style={{ minWidth: '150px' }}>
            <Text style={{ fontSize: '12px' }}>
              {record.creditsRemaining} / {record.monthlyAllocation}
            </Text>
            <Progress
              percent={percentage}
              size="small"
              status={status}
              strokeColor={percentage < 10 ? '#ff4d4f' : percentage < 30 ? '#faad14' : '#52c41a'}
            />
          </div>
        );
      },
    },
    {
      title: <Text strong>Contact</Text>,
      dataIndex: 'ownerEmail',
      key: 'ownerEmail',
      render: (email: string) => (
        <Text style={{ fontSize: '12px' }}>{email}</Text>
      ),
    },
    {
      title: <Text strong>Version</Text>,
      dataIndex: 'lastRolloutVersion',
      key: 'lastRolloutVersion',
      width: 120,
      sorter: (a, b) => (a.lastRolloutVersion || '').localeCompare(b.lastRolloutVersion || ''),
      render: (version: string, record) => {
        if (!version) return <Text type="secondary" style={{ fontSize: '12px' }}>—</Text>;
        const rolloutDate = record.lastRolloutAt
          ? new Date((record.lastRolloutAt.seconds || record.lastRolloutAt._seconds || 0) * 1000)
          : null;
        return (
          <div>
            <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{version}</Tag>
            {rolloutDate && rolloutDate.getTime() > 0 && (
              <div style={{ marginTop: '2px' }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {rolloutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: <Text strong>Actions</Text>,
      key: 'actions',
      align: 'center',
      width: 80,
      render: (_, record) => {
        const tenant = tenants.find(t => t.id === record.id);
        return tenant ? (
          <Dropdown menu={getActionMenu(tenant)} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ) : null;
      },
    },
  ];

  const tableData: TableDataType[] = filteredTenants.map(tenant => ({
    key: tenant.id,
    id: tenant.id,
    businessName: tenant.businessName,
    domain: tenant.domain,
    status: tenant.status,
    licensingStatus: tenant.licensingStatus,
    ownerEmail: tenant.ownerEmail,
    plan: (tenant as any).plan || tenant.credits?.planId || 'starter',
    creditsRemaining: tenant.credits?.creditsRemaining || 0,
    monthlyAllocation: tenant.credits?.monthlyAllocation || 0,
    lastRolloutVersion: (tenant as any).lastRolloutVersion,
    lastRolloutAt: (tenant as any).lastRolloutAt,
    lastLogin: (tenant as any).lastLogin,
  }));

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh' }}>
      <Space vertical size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Tenant Management</Title>
            <Text type="secondary">Manage newspaper licenses and provisioning</Text>
          </div>
          <Link href="/admin/tenants/new">
            <Button type="primary" size="large" icon={<PlusOutlined />}>
              Add Newspaper
            </Button>
          </Link>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Total Newspapers</Text>}
                value={stats.total}
                prefix={<TeamOutlined style={{ color: '#3b82f6' }} />}
                styles={{ content: { fontSize: '28px' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Active</Text>}
                value={stats.active}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                styles={{ content: { fontSize: '28px' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Deployed</Text>}
                value={stats.deployed}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                styles={{ content: { fontSize: '28px' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Suspended</Text>}
                value={stats.suspended}
                prefix={<StopOutlined style={{ color: '#ff4d4f' }} />}
                styles={{ content: { fontSize: '28px' } }}
              />
            </Card>
          </Col>
        </Row>

        {staleTenants.length > 0 && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message={`${staleTenants.length} tenant${staleTenants.length > 1 ? 's' : ''} behind latest version (v${platformVersion})`}
            description={staleTenants.map(t => t.businessName).join(', ')}
            style={{ marginBottom: 0 }}
          />
        )}

        <Card
          title={<Title level={4} style={{ margin: 0 }}>All Newspapers</Title>}
          extra={
            <Search
              placeholder="Search newspapers..."
              allowClear
              style={{ width: 300 }}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<SearchOutlined />}
            />
          }
        >
          <Table
            columns={columns}
            dataSource={tableData}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} newspapers`,
            }}
            scroll={{ x: 1000 }}
          />
        </Card>
      </Space>
    </div>
  );
}
