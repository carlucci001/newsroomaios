'use client';

import 'antd/dist/reset.css';
import { useState, useEffect } from 'react';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { getAuthInstance } from '@/lib/firebase';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Button,
  Input,
  Tag,
  Spin,
  message,
  Modal,
  Form,
  Select,
  Table,
  Tooltip,
  Empty,
} from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  DeleteOutlined,
  EditOutlined,
  CrownOutlined,
  MailOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface TeamMember {
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
  isPrimaryOwner: boolean;
  status: string;
  createdAt: string | null;
}

/** Get Firebase Auth ID token for API calls */
async function getIdToken(): Promise<string | null> {
  try {
    const auth = getAuthInstance();
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return await currentUser.getIdToken();
  } catch {
    return null;
  }
}

export default function TeamPage() {
  useTheme(); // ensure theme context is available
  const [, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;
      setUser(currentUser);

      const userTenant = await getUserTenant(currentUser.uid);
      setTenant(userTenant);

      if (userTenant) {
        await fetchMembers();
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMembers() {
    try {
      const idToken = await getIdToken();
      if (!idToken) return;

      const res = await fetch('/api/account/team', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        console.warn('Team API returned:', res.status);
        setMembers([]);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  }

  async function handleAddMember() {
    try {
      const values = await form.validateFields();
      setAdding(true);

      const idToken = await getIdToken();
      if (!idToken) {
        message.error('Not authenticated');
        return;
      }

      const res = await fetch('/api/account/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: values.email,
          displayName: values.displayName || values.email.split('@')[0],
          role: values.role || 'admin',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.error || 'Failed to add team member');
        return;
      }

      message.success(`${values.email} has been granted platform account access`);
      setShowAddModal(false);
      form.resetFields();
      await fetchMembers();
    } catch (error: any) {
      if (error?.errorFields) return; // form validation
      message.error('Failed to add team member');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(member: TeamMember) {
    if (member.isPrimaryOwner) {
      message.warning('Cannot remove the primary owner');
      return;
    }

    Modal.confirm({
      title: 'Remove Platform Access',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Remove <strong>{member.email}</strong> from platform account access?</p>
          <p style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
            They will no longer be able to log in to newsroomaios.com to view billing, credits, or settings.
            This does not affect their access to the newspaper admin panel.
          </p>
        </div>
      ),
      okText: 'Remove',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const idToken = await getIdToken();
          if (!idToken) return;

          const res = await fetch('/api/account/team', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ uid: member.uid }),
          });

          const data = await res.json();
          if (!res.ok) {
            message.error(data.error || 'Failed to remove team member');
            return;
          }

          message.success(`${member.email} removed from platform access`);
          await fetchMembers();
        } catch {
          message.error('Failed to remove team member');
        }
      },
    });
  }

  function handleEditMember(member: TeamMember) {
    setEditingMember(member);
    editForm.setFieldsValue({
      displayName: member.displayName || '',
      role: member.role,
    });
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editingMember) return;
    try {
      const values = await editForm.validateFields();
      setEditing(true);

      const idToken = await getIdToken();
      if (!idToken) {
        message.error('Not authenticated');
        return;
      }

      const res = await fetch('/api/account/team', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          uid: editingMember.uid,
          role: values.role,
          displayName: values.displayName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.error || 'Failed to update team member');
        return;
      }

      message.success(`${editingMember.email} updated`);
      setShowEditModal(false);
      setEditingMember(null);
      await fetchMembers();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error('Failed to update team member');
    } finally {
      setEditing(false);
    }
  }

  const columns = [
    {
      title: 'Member',
      key: 'member',
      render: (_: any, record: TeamMember) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong>{record.displayName || record.email.split('@')[0]}</Text>
            {record.isPrimaryOwner && (
              <Tooltip title="Primary account owner">
                <CrownOutlined style={{ color: '#faad14', fontSize: 16 }} />
              </Tooltip>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>{record.email}</Text>
        </div>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      width: 120,
      render: (_: any, record: TeamMember) => (
        <Tag color={record.role === 'owner' ? 'gold' : 'blue'}>
          {record.role === 'owner' ? 'Owner' : 'Admin'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: any, record: TeamMember) => (
        <Tag color={record.status === 'active' ? 'green' : 'red'}>
          {record.status === 'active' ? 'Active' : 'Blocked'}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: any, record: TeamMember) => {
        if (record.isPrimaryOwner) return null;
        return (
          <div style={{ display: 'flex', gap: 4 }}>
            <Tooltip title="Edit member">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditMember(record)}
              />
            </Tooltip>
            <Tooltip title="Remove platform access">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveMember(record)}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto' }}>
        <Card>
          <Empty description="No newspaper linked to your account" />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <TeamOutlined style={{ marginRight: 8 }} />
          Team Management
        </Title>
        <Text type="secondary">
          Manage who can access your newspaper&apos;s platform account on newsroomaios.com
        </Text>
      </div>

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Account Members ({members.length})</span>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setShowAddModal(true)}
            >
              Add Member
            </Button>
          </div>
        }
      >
        {members.length === 0 ? (
          <Empty
            description="No team members found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            dataSource={members}
            columns={columns}
            rowKey="uid"
            pagination={false}
            size="middle"
          />
        )}
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Title level={5}>How Team Access Works</Title>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={{ marginBottom: 8 }}>
            <Text>
              <strong>Primary Owner</strong> — The account holder who created the newspaper. Cannot be removed.
            </Text>
          </li>
          <li style={{ marginBottom: 8 }}>
            <Text>
              <strong>Owners &amp; Admins</strong> — Can log in to newsroomaios.com to view billing, credits, messages, and settings.
            </Text>
          </li>
          <li style={{ marginBottom: 8 }}>
            <Text>
              <strong>Newspaper Admin Panel</strong> — User roles on your newspaper site (editors, contributors, etc.) are managed separately from your newspaper&apos;s admin panel.
            </Text>
          </li>
          <li>
            <Text>
              To add someone as an admin on your newspaper, go to your <a href={tenant.domain ? `https://${tenant.domain}/admin` : '#'} target="_blank" rel="noopener noreferrer">Newspaper Admin Panel</a> &rarr; Users &amp; Roles &rarr; Add User.
            </Text>
          </li>
        </ul>
      </Card>

      {/* Add Member Modal */}
      <Modal
        title={
          <span>
            <UserAddOutlined style={{ marginRight: 8 }} />
            Add Team Member
          </span>
        }
        open={showAddModal}
        onOk={handleAddMember}
        onCancel={() => {
          setShowAddModal(false);
          form.resetFields();
        }}
        confirmLoading={adding}
        okText="Add Member"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="admin@example.com" />
          </Form.Item>

          <Form.Item
            name="displayName"
            label="Display Name"
          >
            <Input placeholder="John Smith" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Account Role"
            initialValue="admin"
          >
            <Select
              options={[
                { value: 'admin', label: 'Admin — Can view billing, credits, and settings' },
                { value: 'owner', label: 'Owner — Full account access' },
              ]}
            />
          </Form.Item>

          <div style={{
            background: '#f0f5ff',
            border: '1px solid #d6e4ff',
            borderRadius: 8,
            padding: 12,
            fontSize: 13,
          }}>
            <strong>Note:</strong> If this person doesn&apos;t have a newsroomaios.com account yet, one will be created automatically. They&apos;ll use the same email to log in.
          </div>
        </Form>
      </Modal>
      {/* Edit Member Modal */}
      <Modal
        title={
          <span>
            <EditOutlined style={{ marginRight: 8 }} />
            Edit Team Member
          </span>
        }
        open={showEditModal}
        onOk={handleSaveEdit}
        onCancel={() => {
          setShowEditModal(false);
          setEditingMember(null);
          editForm.resetFields();
        }}
        confirmLoading={editing}
        okText="Save Changes"
      >
        {editingMember && (
          <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
            <div style={{
              background: '#f6f6f6',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
              fontSize: 14,
            }}>
              <strong>{editingMember.email}</strong>
            </div>

            <Form.Item
              name="displayName"
              label="Display Name"
            >
              <Input placeholder="John Smith" />
            </Form.Item>

            <Form.Item
              name="role"
              label="Account Role"
            >
              <Select
                options={[
                  { value: 'admin', label: 'Admin — Can view billing, credits, and settings' },
                  { value: 'owner', label: 'Owner — Full account access' },
                ]}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
