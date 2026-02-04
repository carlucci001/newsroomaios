'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Button,
  Input,
  Space,
  Tag,
  Spin,
  Row,
  Col,
  Statistic,
  Table,
  Modal,
  Select,
  Checkbox,
  Alert,
  Empty,
} from 'antd';
import {
  UploadOutlined,
  GithubOutlined,
  FilterOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  WarningOutlined,
  LinkOutlined,
  CalendarOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface UpdateLog {
  id: string;
  version: string;
  description: string;
  targetTenants: string[]; // 'all' or specific tenant IDs
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  initiatedBy: string;
  initiatedAt: Date;
  completedAt?: Date;
  results?: {
    tenantId: string;
    success: boolean;
    message?: string;
  }[];
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
}

export default function UpdatesPage() {
  const { isDark } = useTheme();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [deployAllTenants, setDeployAllTenants] = useState(true);
  const [deployNotes, setDeployNotes] = useState('');
  const [deploying, setDeploying] = useState(false);

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

      // Fetch update logs
      try {
        const logsQuery = query(collection(db, 'updateLogs'), orderBy('initiatedAt', 'desc'), limit(20));
        const logsSnap = await getDocs(logsQuery);
        const logsData = logsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UpdateLog[];
        setUpdateLogs(logsData);
      } catch (e) {
        // Collection might not exist yet
      }

      // Fetch GitHub releases (mock data for now - would need API integration)
      setReleases([
        {
          tag_name: 'v1.2.0',
          name: 'Version 1.2.0 - Performance Improvements',
          published_at: new Date().toISOString(),
          body: '- Improved article generation speed\n- Fixed image loading issues\n- Added new category templates',
          html_url: 'https://github.com/carlucci001/wnct-next/releases/tag/v1.2.0',
        },
        {
          tag_name: 'v1.1.0',
          name: 'Version 1.1.0 - AI Enhancements',
          published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          body: '- Enhanced AI journalist capabilities\n- Better SEO optimization\n- Improved fact-checking accuracy',
          html_url: 'https://github.com/carlucci001/wnct-next/releases/tag/v1.1.0',
        },
        {
          tag_name: 'v1.0.0',
          name: 'Version 1.0.0 - Initial Release',
          published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          body: '- Core newspaper functionality\n- AI article generation\n- Admin dashboard',
          html_url: 'https://github.com/carlucci001/wnct-next/releases/tag/v1.0.0',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function initiateDeployment() {
    if (!selectedVersion) return;

    setDeploying(true);
    try {
      const db = getDb();
      const targetTenants = deployAllTenants ? ['all'] : selectedTenants;

      // Create update log entry
      await addDoc(collection(db, 'updateLogs'), {
        version: selectedVersion,
        description: deployNotes || `Deploying ${selectedVersion}`,
        targetTenants,
        status: 'pending',
        initiatedBy: 'admin', // Would use actual user ID
        initiatedAt: new Date(),
      });

      // In a real implementation, this would trigger a GitHub Actions workflow
      // or a Cloud Function to deploy updates to each tenant's Vercel project

      await fetchData();
      setShowDeployModal(false);
      setSelectedVersion('');
      setSelectedTenants([]);
      setDeployNotes('');
    } catch (error) {
      console.error('Failed to initiate deployment:', error);
    } finally {
      setDeploying(false);
    }
  }

  const stats = {
    totalDeployments: updateLogs.length,
    pendingDeployments: updateLogs.filter((l) => l.status === 'pending').length,
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
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (version: string) => <Tag color="blue">{version}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Targets',
      dataIndex: 'targetTenants',
      key: 'targetTenants',
      render: (targetTenants: string[]) => (
        <Text type="secondary">
          {targetTenants.includes('all') ? 'All tenants' : `${targetTenants.length} tenant(s)`}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'warning',
          in_progress: 'processing',
          completed: 'success',
          failed: 'error',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'initiatedAt',
      key: 'initiatedAt',
      render: (date: any) => {
        const timestamp = date instanceof Date ? date : new Date(date?.seconds * 1000 || Date.now());
        return <Text type="secondary">{timestamp.toLocaleString()}</Text>;
      },
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh' }}>
      <Space vertical size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Update Deployment</Title>
            <Text type="secondary">Deploy platform updates to newspapers via GitHub</Text>
          </div>
          <Button type="primary" size="large" icon={<UploadOutlined />} onClick={() => setShowDeployModal(true)}>
            Deploy Update
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Total Deployments</Text>}
                value={stats.totalDeployments}
                prefix={<DashboardOutlined style={{ color: '#3b82f6' }} />}
                styles={{ content: { fontSize: '28px' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Pending</Text>}
                value={stats.pendingDeployments}
                prefix={<WarningOutlined style={{ color: '#faad14' }} />}
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

        <Card title={<Title level={4} style={{ margin: 0 }}>Deployment Pipeline</Title>}>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>Automated deployment workflow</Text>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <GithubOutlined style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <Text strong style={{ display: 'block' }}>Source Repository</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>carlucci001/wnct-next</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#faad14', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <FilterOutlined style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <Text strong style={{ display: 'block' }}>Build & Test</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>GitHub Actions</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <CloudServerOutlined style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <Text strong style={{ display: 'block' }}>Deploy</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>Vercel Projects</Text>
            </div>
          </div>
        </Card>

        <Card title={<Title level={4} style={{ margin: 0 }}>Available Releases</Title>}>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>Ready to deploy versions</Text>
          <Space vertical size="middle" style={{ width: '100%' }}>
            {releases.map((release) => (
              <Card key={release.tag_name} size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Tag color="blue">{release.tag_name}</Tag>
                      <Text strong>{release.name}</Text>
                    </div>
                    <Text style={{ whiteSpace: 'pre-line', display: 'block', marginBottom: '8px' }}>
                      {release.body}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarOutlined style={{ fontSize: '12px' }} />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Released {new Date(release.published_at).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                  <Space>
                    <Button
                      icon={<LinkOutlined />}
                      href={release.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                    <Button
                      type="primary"
                      onClick={() => {
                        setSelectedVersion(release.tag_name);
                        setShowDeployModal(true);
                      }}
                    >
                      Deploy
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </Space>
        </Card>

        <Card title={<Title level={4} style={{ margin: 0 }}>Deployment History</Title>}>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>Recent deployment activity</Text>
          <Table
            dataSource={updateLogs}
            columns={columns}
            rowKey="id"
            locale={{
              emptyText: <Empty description="No deployments yet. Deploy your first update to get started." />,
            }}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>

      <Modal
        title={<Title level={4} style={{ margin: 0 }}>Deploy Update</Title>}
        open={showDeployModal}
        onCancel={() => {
          setShowDeployModal(false);
          setSelectedVersion('');
          setSelectedTenants([]);
          setDeployNotes('');
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setShowDeployModal(false);
              setSelectedVersion('');
              setSelectedTenants([]);
              setDeployNotes('');
            }}
          >
            Cancel
          </Button>,
          <Button
            key="deploy"
            type="primary"
            disabled={!selectedVersion || (!deployAllTenants && selectedTenants.length === 0)}
            loading={deploying}
            onClick={initiateDeployment}
          >
            Start Deployment
          </Button>,
        ]}
      >
        <Space vertical size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Version</Text>
            <Select
              value={selectedVersion}
              onChange={setSelectedVersion}
              placeholder="Select a version..."
              style={{ width: '100%' }}
              size="large"
            >
              {releases.map((release) => (
                <Select.Option key={release.tag_name} value={release.tag_name}>
                  {release.tag_name} - {release.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <Checkbox
              checked={deployAllTenants}
              onChange={(e) => setDeployAllTenants(e.target.checked)}
              style={{ marginBottom: '12px' }}
            >
              <Text strong>Deploy to all active tenants</Text>
            </Checkbox>

            {!deployAllTenants && (
              <Card size="small" style={{ maxHeight: '200px', overflow: 'auto' }}>
                <Space vertical size="small">
                  {tenants.map((tenant) => (
                    <Checkbox
                      key={tenant.id}
                      checked={selectedTenants.includes(tenant.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTenants([...selectedTenants, tenant.id]);
                        } else {
                          setSelectedTenants(selectedTenants.filter((id) => id !== tenant.id));
                        }
                      }}
                    >
                      {tenant.businessName}
                    </Checkbox>
                  ))}
                </Space>
              </Card>
            )}
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Deployment Notes (Optional)</Text>
            <Input
              placeholder="Add any notes about this deployment..."
              value={deployNotes}
              onChange={(e) => setDeployNotes(e.target.value)}
              size="large"
            />
          </div>

          <Alert
            message="Deployment Notice"
            description="This will trigger a rebuild and redeploy of all selected tenant sites. The process typically completes within 5-10 minutes."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
        </Space>
      </Modal>
    </div>
  );
}
