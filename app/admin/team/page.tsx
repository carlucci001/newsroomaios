'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDb, getStorageInstance } from '@/lib/firebase';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Switch,
  InputNumber,
  Row,
  Col,
  Avatar,
  Tag,
  Spin,
  Empty,
  Popconfirm,
  message as antMessage,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  GlobalOutlined,
  UploadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface TeamMember {
  id: string;
  name: string;
  title: string;
  department: string;
  bio: string;
  photoURL: string;
  email?: string;
  linkedIn?: string;
  isVisible: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface TeamPageSettings {
  isPublic: boolean;
  pageTitle: string;
  pageSubtitle: string;
}

const DEPARTMENTS = [
  { value: 'Leadership', label: 'Leadership', color: 'gold' },
  { value: 'Engineering', label: 'Engineering', color: 'blue' },
  { value: 'Design', label: 'Design', color: 'purple' },
  { value: 'Content', label: 'Content', color: 'green' },
  { value: 'Operations', label: 'Operations', color: 'orange' },
];

const deptColor = (dept: string) => DEPARTMENTS.find(d => d.value === dept)?.color || 'default';

const MARGE_PHOTO = 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0242565142.firebasestorage.app/o/avatars%2F5bacf02c-2f6d-4651-8cf0-5b23c0f01996%2F1767633685245_Screenshot_20251231_075714_Samsung%20Wallet.jpg?alt=media&token=c81d6723-8160-47fd-93cd-6d7b0eee7dbe';

const SEED_TEAM: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Carl Farrington',
    title: 'CEO & Founder',
    department: 'Leadership',
    bio: 'Founded Newsroom AIOS to revitalize local journalism through AI-powered automation. Combines deep software engineering experience with a passion for community-driven news.',
    photoURL: '',
    isVisible: true,
    displayOrder: 0,
  },
  {
    name: 'Marge Farrington',
    title: 'COO & Co-Founder',
    department: 'Leadership',
    bio: 'Oversees daily operations, partner relationships, and business development. Ensures every paper partner receives white-glove onboarding and ongoing support.',
    photoURL: MARGE_PHOTO,
    isVisible: true,
    displayOrder: 1,
  },
  {
    name: 'David Mitchell',
    title: 'Chief Technology Officer',
    department: 'Engineering',
    bio: 'Leads platform architecture, infrastructure, and technical strategy. Previously built distributed systems at scale for enterprise SaaS companies. Passionate about reliable, performant cloud-native design.',
    photoURL: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=faces',
    isVisible: true,
    displayOrder: 2,
  },
  {
    name: 'Sarah Collins',
    title: 'Lead Software Engineer',
    department: 'Engineering',
    bio: 'Drives the core platform development across the full stack. Expert in Next.js, React, TypeScript, and cloud infrastructure. Obsessed with clean architecture and developer experience.',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces',
    isVisible: true,
    displayOrder: 3,
  },
  {
    name: 'James Crawford',
    title: 'AI & Machine Learning Engineer',
    department: 'Engineering',
    bio: 'Designs and optimizes the AI content pipeline — article generation, fact-checking, and natural language processing. Background in computational linguistics and large language model integration.',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces',
    isVisible: true,
    displayOrder: 4,
  },
  {
    name: 'Emily Torres',
    title: 'Senior Full-Stack Developer',
    department: 'Engineering',
    bio: 'Builds tenant-facing features, the admin dashboard, and real-time collaboration tools. Focused on performance optimization and mobile-first responsive design.',
    photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=faces',
    isVisible: true,
    displayOrder: 5,
  },
  {
    name: 'Marcus Johnson',
    title: 'DevOps & Cloud Engineer',
    department: 'Engineering',
    bio: 'Manages Vercel deployments, CI/CD pipelines, Firebase infrastructure, and monitoring across the entire multi-tenant network. Keeps 17+ newspaper sites running smoothly around the clock.',
    photoURL: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&h=400&fit=crop&crop=faces',
    isVisible: true,
    displayOrder: 6,
  },
  {
    name: 'Nicole Harper',
    title: 'UX/UI Designer',
    department: 'Design',
    bio: 'Creates the visual identity and user experience across all platform surfaces — from the public marketing site to the newspaper admin dashboards. Human-centered design advocate.',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces',
    isVisible: true,
    displayOrder: 7,
  },
  {
    name: 'Claire Beaumont',
    title: 'Editorial Director',
    department: 'Content',
    bio: 'Guides AI content quality standards, editorial voice, and journalistic integrity. Former newspaper editor with 15+ years in local journalism covering communities across the Southeast.',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces',
    isVisible: true,
    displayOrder: 8,
  },
  {
    name: 'Jason Rivera',
    title: 'Head of Growth & Marketing',
    department: 'Operations',
    bio: 'Drives partner acquisition, market expansion, and brand awareness. Takes a data-driven approach to growing the newspaper network and proving ROI for paper partners.',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces',
    isVisible: true,
    displayOrder: 9,
  },
  {
    name: 'Stephen Ankenman',
    title: 'International Operations Officer',
    department: 'Operations',
    bio: 'Leads international expansion strategy and oversees global operations. Brings cross-border business experience to scale the Newsroom AIOS platform into new markets worldwide.',
    photoURL: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces',
    isVisible: true,
    displayOrder: 10,
  },
];

export default function TeamAdminPage() {
  const { isDark } = useTheme();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Page settings
  const [pageSettings, setPageSettings] = useState<TeamPageSettings>({
    isPublic: false,
    pageTitle: 'Meet Our Team',
    pageSubtitle: 'The people behind Newsroom AIOS — building the future of AI-powered local journalism.',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchMembers = async () => {
    try {
      const db = getDb();
      const q = query(collection(db, 'teamMembers'), orderBy('displayOrder', 'asc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as TeamMember[];
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const db = getDb();
      const snap = await getDoc(doc(db, 'settings', 'team'));
      if (snap.exists()) {
        setPageSettings(snap.data() as TeamPageSettings);
      }
    } catch (error) {
      console.error('Failed to fetch team settings:', error);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchSettings();
  }, []);

  const saveSettings = async (updated: Partial<TeamPageSettings>) => {
    setSavingSettings(true);
    try {
      const db = getDb();
      const merged = { ...pageSettings, ...updated };
      await setDoc(doc(db, 'settings', 'team'), merged, { merge: true });
      setPageSettings(merged);
      antMessage.success('Page settings saved');
    } catch (error) {
      antMessage.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const storage = getStorageInstance();
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `team-photos/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      form.setFieldValue('photoURL', url);
      antMessage.success('Photo uploaded');
    } catch (error) {
      console.error('Upload failed:', error);
      antMessage.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    form.resetFields();
    form.setFieldsValue({
      department: 'Engineering',
      isVisible: true,
      displayOrder: members.length,
    });
    setModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    form.setFieldsValue(member);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const db = getDb();
      const now = new Date().toISOString();

      // Firestore rejects undefined values — strip them out, default to empty string
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        clean[k] = v === undefined || v === null ? (typeof v === 'boolean' ? false : '') : v;
      }
      // Ensure isVisible is always a boolean
      if (typeof clean.isVisible !== 'boolean') clean.isVisible = true;
      if (typeof clean.displayOrder !== 'number') clean.displayOrder = 0;

      if (editingMember) {
        await setDoc(doc(db, 'teamMembers', editingMember.id), {
          ...clean,
          updatedAt: now,
          createdAt: editingMember.createdAt,
        }, { merge: true });
        antMessage.success('Team member updated');
      } else {
        const newId = `member_${Date.now()}`;
        await setDoc(doc(db, 'teamMembers', newId), {
          ...clean,
          createdAt: now,
          updatedAt: now,
        });
        antMessage.success('Team member added');
      }

      setModalOpen(false);
      form.resetFields();
      setEditingMember(null);
      fetchMembers();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return; // validation error
      antMessage.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'teamMembers', id));
      antMessage.success('Team member removed');
      fetchMembers();
    } catch (error) {
      antMessage.error('Failed to delete');
    }
  };

  const toggleVisibility = async (member: TeamMember) => {
    try {
      const db = getDb();
      await setDoc(doc(db, 'teamMembers', member.id), {
        isVisible: !member.isVisible,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, isVisible: !m.isVisible } : m));
    } catch (error) {
      antMessage.error('Failed to update visibility');
    }
  };

  const seedTeam = async () => {
    if (members.length > 0) {
      Modal.confirm({
        title: 'Seed team data?',
        content: 'This will add 10 sample team members. Existing members will NOT be removed.',
        onOk: doSeed,
      });
    } else {
      doSeed();
    }
  };

  const doSeed = async () => {
    setSeeding(true);
    try {
      const db = getDb();
      const now = new Date().toISOString();
      for (const member of SEED_TEAM) {
        const id = `member_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await setDoc(doc(db, 'teamMembers', id), {
          ...member,
          createdAt: now,
          updatedAt: now,
        });
      }
      antMessage.success(`Seeded ${SEED_TEAM.length} team members`);
      fetchMembers();
    } catch (error) {
      antMessage.error('Failed to seed team');
    } finally {
      setSeeding(false);
    }
  };

  const resetAndReseed = async () => {
    Modal.confirm({
      title: 'Reset & Re-seed?',
      content: 'This will DELETE all current team members and replace them with the default team profiles (with photos). This cannot be undone.',
      okText: 'Reset & Re-seed',
      okType: 'danger',
      async onOk() {
        setSeeding(true);
        try {
          const db = getDb();
          // Delete all existing members
          const snap = await getDocs(collection(db, 'teamMembers'));
          for (const d of snap.docs) {
            await deleteDoc(doc(db, 'teamMembers', d.id));
          }
          // Re-create with updated data
          const now = new Date().toISOString();
          for (const member of SEED_TEAM) {
            const id = `member_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            await setDoc(doc(db, 'teamMembers', id), {
              ...member,
              createdAt: now,
              updatedAt: now,
            });
          }
          antMessage.success('Team reset with updated profiles and photos');
          fetchMembers();
        } catch (error) {
          antMessage.error('Failed to reset team');
        } finally {
          setSeeding(false);
        }
      },
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Our Team</Title>
            <Text type="secondary">Manage team profiles displayed on the public website</Text>
          </div>
          <Space>
            {members.length === 0 && (
              <Button onClick={seedTeam} loading={seeding}>
                Seed Sample Team
              </Button>
            )}
            {members.length > 0 && (
              <Button danger onClick={resetAndReseed} loading={seeding}>
                Reset & Re-seed
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
              Add Member
            </Button>
          </Space>
        </div>

        {/* Page Settings */}
        <Card
          size="small"
          title={
            <Space>
              <GlobalOutlined />
              <span>Public Page Settings</span>
            </Space>
          }
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={6}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Switch
                  checked={pageSettings.isPublic}
                  onChange={(checked) => saveSettings({ isPublic: checked })}
                  loading={savingSettings}
                />
                <div>
                  <Text strong>Show on Website</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {pageSettings.isPublic ? 'Team page is live at /team' : 'Team page is hidden from visitors'}
                  </Text>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={9}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Page Title</Text>
              <Input
                value={pageSettings.pageTitle}
                onChange={e => setPageSettings(prev => ({ ...prev, pageTitle: e.target.value }))}
                onBlur={() => saveSettings({ pageTitle: pageSettings.pageTitle })}
                placeholder="Meet Our Team"
              />
            </Col>
            <Col xs={24} sm={9}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Page Subtitle</Text>
              <Input
                value={pageSettings.pageSubtitle}
                onChange={e => setPageSettings(prev => ({ ...prev, pageSubtitle: e.target.value }))}
                onBlur={() => saveSettings({ pageSubtitle: pageSettings.pageSubtitle })}
                placeholder="The people behind Newsroom AIOS"
              />
            </Col>
          </Row>
        </Card>

        {/* Team Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
        ) : members.length === 0 ? (
          <Card>
            <Empty description="No team members yet">
              <Space>
                <Button type="primary" onClick={openAddModal}>Add First Member</Button>
                <Button onClick={seedTeam} loading={seeding}>Seed Sample Team</Button>
              </Space>
            </Empty>
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {members.map((member) => (
              <Col key={member.id} xs={24} sm={12} lg={8} xl={6}>
                <Card
                  hoverable
                  style={{
                    opacity: member.isVisible ? 1 : 0.6,
                    height: '100%',
                  }}
                  actions={[
                    <Button
                      key="visibility"
                      type="text"
                      size="small"
                      icon={member.isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(member); }}
                    >
                      {member.isVisible ? 'Visible' : 'Hidden'}
                    </Button>,
                    <Button
                      key="edit"
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => { e.stopPropagation(); openEditModal(member); }}
                    >
                      Edit
                    </Button>,
                    <Popconfirm
                      key="delete"
                      title="Remove this team member?"
                      onConfirm={() => handleDelete(member.id)}
                      okText="Remove"
                      okType="danger"
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />}>
                        Delete
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <Avatar
                      size={80}
                      src={member.photoURL || undefined}
                      icon={!member.photoURL ? <UserOutlined /> : undefined}
                      style={{
                        backgroundColor: member.photoURL ? undefined : '#3b82f6',
                        marginBottom: 8,
                      }}
                    />
                    <Title level={5} style={{ margin: '4px 0 0 0' }}>{member.name}</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>{member.title}</Text>
                    <div style={{ marginTop: 6 }}>
                      <Tag color={deptColor(member.department)}>{member.department}</Tag>
                      {!member.isVisible && <Tag>Hidden</Tag>}
                    </div>
                  </div>
                  <Paragraph
                    type="secondary"
                    style={{ fontSize: 12, margin: 0 }}
                    ellipsis={{ rows: 3 }}
                  >
                    {member.bio}
                  </Paragraph>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Order: {member.displayOrder}</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Space>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingMember(null); form.resetFields(); }}
        title={editingMember ? `Edit ${editingMember.name}` : 'Add Team Member'}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
                <Input placeholder="Jane Smith" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="title" label="Job Title" rules={[{ required: true, message: 'Title is required' }]}>
                <Input placeholder="Lead Software Engineer" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Select options={DEPARTMENTS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="displayOrder" label="Display Order">
                <InputNumber min={0} max={99} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="bio" label="Bio" rules={[{ required: true, message: 'Bio is required' }]}>
            <TextArea rows={3} placeholder="2-3 sentence professional bio..." maxLength={500} showCount />
          </Form.Item>

          <Form.Item label="Photo">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* Preview */}
              <Avatar
                size={64}
                src={form.getFieldValue('photoURL') || undefined}
                icon={!form.getFieldValue('photoURL') ? <UserOutlined /> : undefined}
                style={{ backgroundColor: form.getFieldValue('photoURL') ? undefined : '#3b82f6', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <Form.Item name="photoURL" noStyle>
                  <Input placeholder="https://example.com/headshot.jpg" style={{ marginBottom: 8 }} />
                </Form.Item>
                <Button
                  icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
                  loading={uploading}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          antMessage.error('Photo must be under 5 MB');
                          return;
                        }
                        handlePhotoUpload(file);
                      }
                    };
                    input.click();
                  }}
                  size="small"
                >
                  Upload Photo
                </Button>
              </div>
            </div>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email (internal only)">
                <Input placeholder="jane@newsroomaios.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="linkedIn" label="LinkedIn URL">
                <Input placeholder="https://linkedin.com/in/janesmith" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isVisible" label="Visible on Public Page" valuePropName="checked">
            <Switch />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setModalOpen(false); setEditingMember(null); form.resetFields(); }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editingMember ? 'Save Changes' : 'Add Member'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
