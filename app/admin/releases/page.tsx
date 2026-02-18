'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
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
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  FileTextOutlined,
  RocketOutlined,
  BulbOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface PlatformRelease {
  id: string;
  type: 'release' | 'roadmap';
  title: string;
  description: string;
  version?: string;
  category: string;
  status: 'draft' | 'published';
  audience: 'all' | 'beta';
  publishedAt: any;
  createdAt: any;
  updatedAt: any;
}

const CATEGORY_COLORS: Record<string, string> = {
  feature: 'blue',
  improvement: 'green',
  bugfix: 'orange',
  security: 'red',
};

interface ReleaseForm {
  type: 'release' | 'roadmap';
  title: string;
  description: string;
  version: string;
  category: string;
  audience: 'all' | 'beta';
}

const EMPTY_FORM: ReleaseForm = {
  type: 'release',
  title: '',
  description: '',
  version: '',
  category: 'feature',
  audience: 'all',
};

export default function ReleasesPage() {
  const { isDark } = useTheme();
  const [releases, setReleases] = useState<PlatformRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchReleases();
  }, []);

  async function fetchReleases() {
    try {
      const db = getDb();
      const q = query(collection(db, 'platformReleases'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReleases(snap.docs.map(d => ({ id: d.id, ...d.data() } as PlatformRelease)));
    } catch (err) {
      console.error('Failed to fetch releases:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(release: PlatformRelease) {
    setEditingId(release.id);
    setForm({
      type: release.type,
      title: release.title,
      description: release.description,
      version: release.version || '',
      category: release.category,
      audience: release.audience,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const db = getDb();
      const now = Timestamp.now();
      const data = {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        version: form.version.trim() || null,
        category: form.category,
        audience: form.audience,
        updatedAt: now,
      };

      if (editingId) {
        await updateDoc(doc(db, 'platformReleases', editingId), data);
      } else {
        await addDoc(collection(db, 'platformReleases'), {
          ...data,
          status: 'draft',
          publishedAt: null,
          createdAt: now,
        });
      }

      setModalOpen(false);
      await fetchReleases();
    } catch (err) {
      console.error('Failed to save release:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(id: string) {
    try {
      const db = getDb();
      await updateDoc(doc(db, 'platformReleases', id), {
        status: 'published',
        publishedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      await fetchReleases();
    } catch (err) {
      console.error('Failed to publish:', err);
    }
  }

  async function handleUnpublish(id: string) {
    try {
      const db = getDb();
      await updateDoc(doc(db, 'platformReleases', id), {
        status: 'draft',
        updatedAt: Timestamp.now(),
      });
      await fetchReleases();
    } catch (err) {
      console.error('Failed to unpublish:', err);
    }
  }

  async function handleDelete(id: string) {
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'platformReleases', id));
      await fetchReleases();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }

  const stats = {
    total: releases.length,
    published: releases.filter(r => r.status === 'published').length,
    drafts: releases.filter(r => r.status === 'draft').length,
    roadmap: releases.filter(r => r.type === 'roadmap').length,
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
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      filters: [
        { text: 'Release', value: 'release' },
        { text: 'Roadmap', value: 'roadmap' },
      ],
      onFilter: (value: any, record: PlatformRelease) => record.type === value,
      render: (type: string) => (
        <Tag color={type === 'release' ? 'blue' : 'purple'}>
          {type === 'release' ? 'Release' : 'Roadmap'}
        </Tag>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: PlatformRelease) => (
        <div>
          <Text strong>{title}</Text>
          {record.version && <Tag style={{ marginLeft: 8 }}>{record.version}</Tag>}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      filters: [
        { text: 'Feature', value: 'feature' },
        { text: 'Improvement', value: 'improvement' },
        { text: 'Bug Fix', value: 'bugfix' },
        { text: 'Security', value: 'security' },
      ],
      onFilter: (value: any, record: PlatformRelease) => record.category === value,
      render: (cat: string) => <Tag color={CATEGORY_COLORS[cat] || 'default'}>{cat}</Tag>,
    },
    {
      title: 'Audience',
      dataIndex: 'audience',
      key: 'audience',
      width: 130,
      filters: [
        { text: 'All', value: 'all' },
        { text: 'Beta Only', value: 'beta' },
      ],
      onFilter: (value: any, record: PlatformRelease) => record.audience === value,
      render: (aud: string) => <Tag>{aud === 'beta' ? 'Beta Only' : 'All'}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      filters: [
        { text: 'Published', value: 'published' },
        { text: 'Draft', value: 'draft' },
      ],
      onFilter: (value: any, record: PlatformRelease) => record.status === value,
      render: (status: string) => (
        <Tag color={status === 'published' ? 'success' : 'default'}>
          {status === 'published' ? 'Published' : 'Draft'}
        </Tag>
      ),
    },
    {
      title: 'Date',
      key: 'date',
      width: 160,
      sorter: (a: PlatformRelease, b: PlatformRelease) => {
        const aDate = a.publishedAt || a.createdAt;
        const bDate = b.publishedAt || b.createdAt;
        if (!aDate) return -1;
        if (!bDate) return 1;
        const aTs = aDate.toDate ? aDate.toDate().getTime() : aDate.seconds * 1000;
        const bTs = bDate.toDate ? bDate.toDate().getTime() : bDate.seconds * 1000;
        return aTs - bTs;
      },
      defaultSortOrder: 'descend' as const,
      render: (_: any, record: PlatformRelease) => {
        const date = record.publishedAt || record.createdAt;
        if (!date) return <Text type="secondary">—</Text>;
        const ts = date.toDate ? date.toDate() : new Date(date.seconds * 1000);
        return <Text type="secondary">{ts.toLocaleDateString()}</Text>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_: any, record: PlatformRelease) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          {record.status === 'draft' ? (
            <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handlePublish(record.id)}>
              Publish
            </Button>
          ) : (
            <Button size="small" onClick={() => handleUnpublish(record.id)}>Unpublish</Button>
          )}
          <Popconfirm title="Delete this release?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh' }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Release Notes & Roadmap</Title>
            <Text type="secondary">Manage changelog entries and roadmap items visible to tenant admins</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreateModal}>
            New Release
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Total</Text>}
                value={stats.total}
                prefix={<FileTextOutlined style={{ color: '#3b82f6' }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Published</Text>}
                value={stats.published}
                prefix={<RocketOutlined style={{ color: '#22c55e' }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Drafts</Text>}
                value={stats.drafts}
                prefix={<EditOutlined style={{ color: '#f59e0b' }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title={<Text strong style={{ fontSize: '14px' }}>Roadmap</Text>}
                value={stats.roadmap}
                prefix={<BulbOutlined style={{ color: '#a855f7' }} />}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            dataSource={releases}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1100 }}
          />
        </Card>
      </Space>

      <Modal
        title={editingId ? 'Edit Release' : 'New Release'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText={editingId ? 'Save Changes' : 'Create'}
        width={640}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%', marginTop: 16 }}>
          <div>
            <Text strong>Type</Text>
            <Select
              value={form.type}
              onChange={v => setForm({ ...form, type: v })}
              style={{ width: '100%', marginTop: 4 }}
              options={[
                { value: 'release', label: 'Release (shipped)' },
                { value: 'roadmap', label: 'Roadmap (upcoming)' },
              ]}
            />
          </div>
          <div>
            <Text strong>Title *</Text>
            <Input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Media Manager for Directory & Events"
              style={{ marginTop: 4 }}
            />
          </div>
          {form.type === 'release' && (
            <div>
              <Text strong>Version</Text>
              <Input
                value={form.version}
                onChange={e => setForm({ ...form, version: e.target.value })}
                placeholder="e.g., v1.3.0"
                style={{ marginTop: 4 }}
              />
            </div>
          )}
          <div>
            <Text strong>Description</Text>
            <TextArea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What shipped or what's coming? Supports markdown."
              rows={6}
              style={{ marginTop: 4 }}
            />
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Category</Text>
              <Select
                value={form.category}
                onChange={v => setForm({ ...form, category: v })}
                style={{ width: '100%', marginTop: 4 }}
                options={[
                  { value: 'feature', label: 'Feature' },
                  { value: 'improvement', label: 'Improvement' },
                  { value: 'bugfix', label: 'Bug Fix' },
                  { value: 'security', label: 'Security' },
                ]}
              />
            </Col>
            <Col span={12}>
              <Text strong>Audience</Text>
              <Select
                value={form.audience}
                onChange={v => setForm({ ...form, audience: v })}
                style={{ width: '100%', marginTop: 4 }}
                options={[
                  { value: 'all', label: 'All Papers' },
                  { value: 'beta', label: 'Beta Only' },
                ]}
              />
            </Col>
          </Row>
        </Space>
      </Modal>
    </div>
  );
}
