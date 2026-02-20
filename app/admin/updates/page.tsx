'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Spin,
  Row,
  Col,
  Statistic,
  Table,
  Modal,
  Select,
  Alert,
  Empty,
  message,
} from 'antd';
import {
  UploadOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Rollout {
  id: string;
  version: string;
  commitHash?: string;
  scope: string;
  dryRun?: boolean;
  totalTenants: number;
  succeeded?: number;
  failed?: number;
  status: string;
  startedAt: any;
  completedAt?: any;
  durationMs?: number;
  staleCount?: number;
  staleTenants?: string[];
}

export default function UpdatesPage() {
  const { isDark } = useTheme();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rollouts, setRollouts] = useState<Rollout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployScope, setDeployScope] = useState<'beta' | 'all'>('beta');
  const [deploying, setDeploying] = useState(false);

  const platformVersion = process.env.NEXT_PUBLIC_PLATFORM_VERSION || '—';

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const db = getDb();

      // Fetch tenants
      const tenantsSnap = await getDocs(collection(db, 'tenants'));
      const tenantsData = tenantsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tenant[];
      setTenants(tenantsData.filter((t) => t.status === 'active'));

      // Fetch rollout history
      try {
        const rolloutsQuery = query(
          collection(db, 'rollouts'),
          orderBy('startedAt', 'desc'),
          limit(20)
        );
        const rolloutsSnap = await getDocs(rolloutsQuery);
        const rolloutsData = rolloutsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Rollout[];
        setRollouts(rolloutsData);
      } catch (e) {
        // Collection might not exist yet
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function initiateDeployment() {
    setDeploying(true);
    try {
      const res = await fetch('/api/tenants/rollout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platform-Secret': process.env.NEXT_PUBLIC_PLATFORM_SECRET || '',
        },
        body: JSON.stringify({
          scope: deployScope,
          version: platformVersion,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        message.success(
          `Rollout complete: ${data.succeeded || 0} succeeded, ${data.failed || 0} failed`
        );
        await fetchData();
        setShowDeployModal(false);
      } else {
        message.error(`Rollout failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to initiate deployment:', error);
      message.error('Failed to connect to rollout API');
    } finally {
      setDeploying(false);
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}m ${remaining}s`;
  };

  const formatDate = (date: any) => {
    if (!date) return '—';
    const ts = date instanceof Date ? date : new Date((date.seconds || date._seconds || 0) * 1000);
    if (ts.getTime() === 0) return '—';
    return ts.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const stats = {
    totalDeployments: rollouts.length,
    lastVersion: rollouts[0]?.version || '—',
    activeTenants: tenants.length,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const columns = [
    {
      title: <Text strong>Version</Text>,
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (version: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {version?.startsWith('v') ? version : `v${version}`}
        </Tag>
      ),
    },
    {
      title: <Text strong>Scope</Text>,
      dataIndex: 'scope',
      key: 'scope',
      width: 100,
      render: (scope: string) => {
        const color = scope === 'all' ? 'green' : scope === 'beta' ? 'orange' : 'default';
        return <Tag color={color}>{scope}</Tag>;
      },
    },
    {
      title: <Text strong>Result</Text>,
      key: 'result',
      width: 140,
      render: (_: any, record: Rollout) => (
        <Space size="small">
          {record.succeeded != null && (
            <Tag icon={<CheckCircleOutlined />} color="success">
              {record.succeeded}
            </Tag>
          )}
          {(record.failed ?? 0) > 0 && (
            <Tag icon={<CloseCircleOutlined />} color="error">
              {record.failed}
            </Tag>
          )}
          {record.status === 'in_progress' && (
            <Tag icon={<ClockCircleOutlined />} color="processing">
              Running
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: <Text strong>Duration</Text>,
      dataIndex: 'durationMs',
      key: 'durationMs',
      width: 90,
      render: (ms: number) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {formatDuration(ms)}
        </Text>
      ),
    },
    {
      title: <Text strong>Status</Text>,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          in_progress: 'processing',
          completed: 'success',
          completed_with_errors: 'warning',
          failed: 'error',
        };
        return <Tag color={colorMap[status] || 'default'}>{status.replace(/_/g, ' ')}</Tag>;
      },
    },
    {
      title: <Text strong>Date</Text>,
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 140,
      render: (date: any) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {formatDate(date)}
        </Text>
      ),
    },
    {
      title: <Text strong>Commit</Text>,
      dataIndex: 'commitHash',
      key: 'commitHash',
      width: 90,
      render: (hash: string) =>
        hash ? (
          <Text code style={{ fontSize: '11px' }}>
            {hash.substring(0, 7)}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>—</Text>
        ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh' }}>
      <Space vertical size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Deployment Center</Title>
            <Text type="secondary">
              Platform v{platformVersion} — Deploy updates to tenant newspapers
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<UploadOutlined />}
            onClick={() => setShowDeployModal(true)}
          >
            Deploy Rollout
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Total Rollouts</Text>}
                value={stats.totalDeployments}
                prefix={<DashboardOutlined style={{ color: '#3b82f6' }} />}
                styles={{ content: { fontSize: '28px' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Latest Version</Text>}
                value={stats.lastVersion}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                styles={{ content: { fontSize: '28px' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Active Tenants</Text>}
                value={stats.activeTenants}
                prefix={<CloudServerOutlined style={{ color: '#52c41a' }} />}
                styles={{ content: { fontSize: '28px' } }}
              />
            </Card>
          </Col>
        </Row>

        <Card title={<Title level={4} style={{ margin: 0 }}>Rollout History</Title>}>
          <Table
            dataSource={rollouts}
            columns={columns}
            rowKey="id"
            locale={{
              emptyText: (
                <Empty description="No rollouts yet. Use the Deploy Rollout button to start." />
              ),
            }}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
          />
        </Card>
      </Space>

      <Modal
        title={<Title level={4} style={{ margin: 0 }}>Deploy Rollout</Title>}
        open={showDeployModal}
        onCancel={() => setShowDeployModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowDeployModal(false)}>
            Cancel
          </Button>,
          <Button
            key="deploy"
            type="primary"
            loading={deploying}
            onClick={initiateDeployment}
          >
            {deployScope === 'beta' ? 'Deploy to Beta (6 tenants)' : `Deploy to All (${tenants.length} tenants)`}
          </Button>,
        ]}
      >
        <Space vertical size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              Version: v{platformVersion}
            </Text>
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Deployment Scope</Text>
            <Select
              value={deployScope}
              onChange={setDeployScope}
              style={{ width: '100%' }}
              size="large"
              options={[
                { label: 'Beta — 6 tenants (wnct, hendo, oceanside, hardhat, atlanta, the42)', value: 'beta' },
                { label: `All — ${tenants.length} active tenants`, value: 'all' },
              ]}
            />
          </div>

          <Alert
            message={deployScope === 'all' ? 'Production Deployment' : 'Beta Deployment'}
            description={
              deployScope === 'all'
                ? 'This will redeploy ALL active tenant sites. Ensure beta testing is complete first.'
                : 'This will redeploy the 6 beta tenant sites for testing before full release.'
            }
            type={deployScope === 'all' ? 'error' : 'warning'}
            showIcon
            icon={<WarningOutlined />}
          />
        </Space>
      </Modal>
    </div>
  );
}
