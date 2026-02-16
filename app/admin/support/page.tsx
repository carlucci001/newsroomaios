'use client';

import 'antd/dist/reset.css';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Table,
  Typography,
  Tag,
  Input,
  Select,
  Space,
  Button,
  Modal,
  Spin,
  Switch,
  message as antMessage,
  Row,
  Col,
  Statistic,
  Badge,
  Avatar,
  Tooltip,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  MessageOutlined,
  BugOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
  WechatOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Ticket {
  id: string;
  tenantId: string;
  tenantName: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';
  type: 'support' | 'bug' | 'feature' | 'chat';
  reporterName: string;
  reporterEmail: string;
  reporterPhoto: string;
  assignedTo: string;
  assignedName: string;
  messageCount: number;
  lastMessageAt: any;
  createdAt: any;
  updatedAt: any;
  diagnostics?: {
    url: string;
    browser: string;
    consoleErrors: string[];
    errorMessage: string;
    timestamp: string;
  };
}

interface TicketMessage {
  id: string;
  content: string;
  senderType: 'user' | 'admin' | 'ai';
  senderName: string;
  senderEmail: string;
  senderPhoto: string;
  attachments: any[];
  createdAt: any;
}

const PLATFORM_SECRET = process.env.NEXT_PUBLIC_PLATFORM_SECRET || 'paper-partner-2024';

async function apiCall(path: string, options: RequestInit = {}) {
  const res = await fetch(`/api/support/tickets${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Platform-Secret': PLATFORM_SECRET,
      ...options.headers,
    },
  });
  return res.json();
}

async function statusApiCall(method: 'GET' | 'POST', body?: any) {
  const res = await fetch('/api/support/status', {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Platform-Secret': PLATFORM_SECRET,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

function formatDate(date: any): string {
  if (!date) return '';
  const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function timeAgo(date: any): string {
  if (!date) return '';
  const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

const statusColors: Record<string, string> = {
  open: 'warning',
  'in-progress': 'processing',
  waiting: 'default',
  resolved: 'success',
  closed: 'default',
};

export default function SupportDashboard() {
  const { isDark } = useTheme();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [deleting, setDeleting] = useState(false);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (search) params.set('search', search);
      const qs = params.toString();
      const data = await apiCall(qs ? `?${qs}` : '');
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Fetch online status on mount
  useEffect(() => {
    statusApiCall('GET').then(data => {
      if (data.success) setIsOnline(data.online);
    });
  }, []);

  // Auto-poll messages when viewing any ticket
  useEffect(() => {
    if (modalOpen && selectedTicket) {
      chatPollRef.current = setInterval(async () => {
        const data = await apiCall(`?id=${selectedTicket.id}`);
        if (data.success) {
          setTicketMessages(prev => {
            if (data.messages.length !== prev.length) {
              return data.messages;
            }
            return prev;
          });
        }
      }, 3000);
    }
    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [modalOpen, selectedTicket?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketMessages]);

  const deleteTicket = async (ticketId: string) => {
    const res = await fetch(`/api/support/tickets?id=${ticketId}`, {
      method: 'DELETE',
      headers: { 'X-Platform-Secret': PLATFORM_SECRET },
    });
    return res.json();
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: `Delete ${selectedRowKeys.length} ticket(s)?`,
      content: 'This will permanently delete the selected tickets and all their messages.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        setDeleting(true);
        let successCount = 0;
        for (const id of selectedRowKeys) {
          const result = await deleteTicket(id as string);
          if (result.success) successCount++;
        }
        antMessage.success(`Deleted ${successCount} ticket(s)`);
        setSelectedRowKeys([]);
        fetchTickets();
        setDeleting(false);
      },
    });
  };

  const toggleOnlineStatus = async () => {
    setTogglingStatus(true);
    const newStatus = !isOnline;
    const data = await statusApiCall('POST', { online: newStatus, adminName: 'Platform Support' });
    if (data.success) {
      setIsOnline(newStatus);
      antMessage.success(newStatus ? 'You are now online — tenants can chat' : 'You are now offline');
    }
    setTogglingStatus(false);
  };

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
    setLoadingMessages(true);
    try {
      const data = await apiCall(`?id=${ticket.id}`);
      if (data.success) {
        setTicketMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setReplying(true);
    try {
      const data = await apiCall('', {
        method: 'PATCH',
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          action: 'reply',
          content: replyText.trim(),
          senderType: 'admin',
          senderName: 'Platform Support',
        }),
      });
      if (data.success) {
        setReplyText('');
        // Refresh messages
        const msgData = await apiCall(`?id=${selectedTicket.id}`);
        if (msgData.success) {
          setTicketMessages(msgData.messages || []);
          setSelectedTicket(prev => prev ? { ...prev, messageCount: (prev.messageCount || 0) + 1 } : null);
        }
        antMessage.success('Reply sent');
        fetchTickets();
      } else {
        antMessage.error(data.error || 'Failed to send reply');
      }
    } catch (err) {
      antMessage.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const data = await apiCall('', {
        method: 'PATCH',
        body: JSON.stringify({ ticketId, action: 'update_status', status }),
      });
      if (data.success) {
        antMessage.success(`Ticket ${status}`);
        setSelectedTicket(prev => prev ? { ...prev, status: status as any } : null);
        fetchTickets();
      }
    } catch (err) {
      antMessage.error('Failed to update status');
    }
  };

  const escalateTicket = async (ticketId: string) => {
    try {
      const data = await apiCall('', {
        method: 'PATCH',
        body: JSON.stringify({ ticketId, action: 'escalate' }),
      });
      if (data.success) {
        antMessage.success('Ticket escalated to urgent');
        setSelectedTicket(prev => prev ? { ...prev, priority: 'urgent' } : null);
        fetchTickets();
      }
    } catch (err) {
      antMessage.error('Failed to escalate');
    }
  };

  // Stats
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in-progress').length;
  const chatCount = tickets.filter(t => t.type === 'chat' && t.status !== 'closed' && t.status !== 'resolved').length;
  const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length;

  const columns: ColumnsType<Ticket> = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 50,
      render: (type: string) => (
        type === 'bug'
          ? <Tooltip title="Bug Report"><BugOutlined style={{ color: '#ff4d4f', fontSize: 16 }} /></Tooltip>
          : type === 'chat'
          ? <Tooltip title="Live Chat"><WechatOutlined style={{ color: '#52c41a', fontSize: 16 }} /></Tooltip>
          : type === 'feature'
          ? <Tooltip title="Feature Request"><BulbOutlined style={{ color: '#faad14', fontSize: 16 }} /></Tooltip>
          : <Tooltip title="Support"><MessageOutlined style={{ color: '#1890ff', fontSize: 16 }} /></Tooltip>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: string) => <Tag color={priorityColors[p]}>{p}</Tag>,
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      render: (subject: string, record: Ticket) => (
        <div>
          <Text strong style={{ cursor: 'pointer' }} onClick={() => openTicket(record)}>{subject}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.tenantName}</Text>
        </div>
      ),
    },
    {
      title: 'Reporter',
      dataIndex: 'reporterName',
      key: 'reporter',
      width: 160,
      responsive: ['md'],
      render: (name: string, record: Ticket) => (
        <Space size="small">
          <Avatar size="small" src={record.reporterPhoto} icon={<UserOutlined />} />
          <Text style={{ fontSize: 13 }}>{name || record.reporterEmail || 'Unknown'}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: 'Messages',
      dataIndex: 'messageCount',
      key: 'messageCount',
      width: 80,
      responsive: ['lg'],
      render: (count: number) => <Badge count={count} style={{ backgroundColor: '#1890ff' }} />,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      responsive: ['lg'],
      render: (date: any) => <Text style={{ fontSize: 12 }}>{timeAgo(date)}</Text>,
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_: any, record: Ticket) => (
        <Button size="small" type="link" onClick={() => openTicket(record)}>View</Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Support Tickets</Title>
            <Text type="secondary">Manage support requests and bug reports from all tenants</Text>
          </div>
          <Space>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 8,
              background: isOnline ? (isDark ? '#0a2e12' : '#f6ffed') : (isDark ? '#2a1215' : '#fff1f0'),
              border: `1px solid ${isOnline ? '#52c41a' : '#ff4d4f'}`,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isOnline ? '#52c41a' : '#ff4d4f',
                boxShadow: isOnline ? '0 0 6px #52c41a' : 'none',
              }} />
              <Text strong style={{ fontSize: 13 }}>{isOnline ? 'Online' : 'Offline'}</Text>
              <Switch
                checked={isOnline}
                onChange={toggleOnlineStatus}
                loading={togglingStatus}
                size="small"
              />
            </div>
            <Button icon={<ReloadOutlined />} onClick={fetchTickets} loading={loading}>Refresh</Button>
          </Space>
        </div>

        {/* Stats */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Open" value={openCount} prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="In Progress" value={inProgressCount} prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Live Chats" value={chatCount} prefix={<WechatOutlined style={{ color: '#52c41a' }} />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Urgent" value={urgentCount} prefix={<ArrowUpOutlined style={{ color: '#ff4d4f' }} />} />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card size="small">
          <Space wrap size="middle">
            <Input
              placeholder="Search tickets..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onPressEnter={fetchTickets}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'open', label: 'Open' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'waiting', label: 'Waiting' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
            <Select
              value={priorityFilter}
              onChange={setPriorityFilter}
              style={{ width: 140 }}
              options={[
                { value: 'all', label: 'All Priority' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
          </Space>
        </Card>

        {/* Tickets Table */}
        <Card>
          {selectedRowKeys.length > 0 && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text>{selectedRowKeys.length} selected</Text>
              <Button danger size="small" onClick={handleDeleteSelected} loading={deleting}>
                Delete Selected
              </Button>
              <Button size="small" onClick={() => setSelectedRowKeys([])}>Clear Selection</Button>
            </div>
          )}
          <Table
            columns={columns}
            dataSource={tickets}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            size="middle"
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            locale={{
              emptyText: <Empty description="No tickets found" />,
            }}
            onRow={(record) => ({
              onClick: () => openTicket(record),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>
      </Space>

      {/* Ticket Detail Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setSelectedTicket(null); setTicketMessages([]); setReplyText(''); }}
        footer={null}
        width={720}
        title={
          selectedTicket ? (
            <Space>
              {selectedTicket.type === 'bug'
                ? <BugOutlined style={{ color: '#ff4d4f' }} />
                : selectedTicket.type === 'chat'
                ? <WechatOutlined style={{ color: '#52c41a' }} />
                : selectedTicket.type === 'feature'
                ? <BulbOutlined style={{ color: '#faad14' }} />
                : <MessageOutlined style={{ color: '#1890ff' }} />
              }
              <span>{selectedTicket.subject}</span>
              {selectedTicket.type === 'chat' && (
                <Tag color="green" style={{ marginLeft: 8 }}>Live Chat</Tag>
              )}
            </Space>
          ) : 'Ticket'
        }
      >
        {selectedTicket && (
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Ticket Meta */}
            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Tag color={statusColors[selectedTicket.status]}>{selectedTicket.status}</Tag>
              <Tag color={priorityColors[selectedTicket.priority]}>{selectedTicket.priority}</Tag>
              <Tag>{selectedTicket.category}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedTicket.tenantName} &middot; {formatDate(selectedTicket.createdAt)}
              </Text>
            </div>

            {/* Reporter */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar src={selectedTicket.reporterPhoto} icon={<UserOutlined />} />
              <div>
                <Text strong>{selectedTicket.reporterName || 'Unknown'}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>{selectedTicket.reporterEmail}</Text>
              </div>
            </div>

            {/* Diagnostics (for bug reports) */}
            {selectedTicket.diagnostics && (
              <Card size="small" style={{ marginBottom: 16, background: isDark ? '#1a1a2e' : '#fff7e6', border: '1px solid #ffd591' }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  <BugOutlined /> Diagnostics
                </Text>
                {selectedTicket.diagnostics.errorMessage && (
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary">Error: </Text>
                    <Text code>{selectedTicket.diagnostics.errorMessage}</Text>
                  </div>
                )}
                {selectedTicket.diagnostics.url && (
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary">URL: </Text>
                    <Text code>{selectedTicket.diagnostics.url}</Text>
                  </div>
                )}
                {selectedTicket.diagnostics.browser && (
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary">Browser: </Text>
                    <Text>{selectedTicket.diagnostics.browser}</Text>
                  </div>
                )}
                {selectedTicket.diagnostics.consoleErrors?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Console Errors ({selectedTicket.diagnostics.consoleErrors.length}):</Text>
                    <div style={{
                      maxHeight: 200, overflow: 'auto',
                      background: isDark ? '#0d1117' : '#f5f5f5',
                      padding: 8, borderRadius: 4, fontSize: 11, fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    }}>
                      {selectedTicket.diagnostics.consoleErrors.map((err, i) => (
                        <div key={i} style={{ marginBottom: 4, color: '#ff4d4f' }}>{err}</div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Messages Thread */}
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Conversation</Text>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ticketMessages.map((msg) => {
                    const isAdmin = msg.senderType === 'admin';
                    const isAI = msg.senderType === 'ai';
                    const isRight = isAdmin;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isRight ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div style={{
                          display: 'flex', alignItems: 'flex-end', gap: 8,
                          flexDirection: isRight ? 'row-reverse' : 'row',
                        }}>
                          <Avatar
                            size="small"
                            src={msg.senderPhoto || undefined}
                            icon={isAI ? <RobotOutlined /> : <UserOutlined />}
                            style={isAI ? { backgroundColor: '#722ed1' } : isAdmin ? { backgroundColor: '#1890ff' } : undefined}
                          />
                          <div style={{
                            maxWidth: '80%',
                            padding: '8px 12px',
                            borderRadius: 12,
                            background: isAdmin
                              ? '#1890ff'
                              : isAI
                              ? (isDark ? '#2d1b4e' : '#f9f0ff')
                              : (isDark ? '#262626' : '#f0f0f0'),
                            color: isAdmin ? '#fff' : undefined,
                          }}>
                            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>
                              {isAI ? 'AI Assistant' : msg.senderName || msg.senderEmail || (isAdmin ? 'Support' : 'User')}
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{msg.content}</div>
                          </div>
                        </div>
                        <Text type="secondary" style={{ fontSize: 10, marginTop: 2, padding: '0 36px' }}>
                          {formatDate(msg.createdAt)}
                        </Text>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Reply Box */}
            {selectedTicket.status !== 'closed' && (
              <div style={{ borderTop: '1px solid', borderColor: isDark ? '#303030' : '#f0f0f0', paddingTop: 12 }}>
                <TextArea
                  rows={3}
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(); }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                  <Space wrap>
                    {selectedTicket.status === 'open' && (
                      <Button size="small" onClick={() => updateTicketStatus(selectedTicket.id, 'in-progress')}>
                        <ClockCircleOutlined /> Mark In Progress
                      </Button>
                    )}
                    {selectedTicket.status !== 'resolved' && (
                      <Button size="small" onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}>
                        <CheckCircleOutlined /> Resolve
                      </Button>
                    )}
                    {selectedTicket.priority !== 'urgent' && (
                      <Button size="small" danger onClick={() => escalateTicket(selectedTicket.id)}>
                        <ArrowUpOutlined /> Escalate
                      </Button>
                    )}
                    <Button size="small" onClick={() => updateTicketStatus(selectedTicket.id, 'closed')}>
                      Close
                    </Button>
                    <Button size="small" danger onClick={() => {
                      Modal.confirm({
                        title: 'Delete this ticket?',
                        content: 'This will permanently delete this ticket and all messages.',
                        okText: 'Delete',
                        okType: 'danger',
                        onOk: async () => {
                          const result = await deleteTicket(selectedTicket.id);
                          if (result.success) {
                            antMessage.success('Ticket deleted');
                            setModalOpen(false);
                            setSelectedTicket(null);
                            fetchTickets();
                          }
                        },
                      });
                    }}>
                      Delete
                    </Button>
                  </Space>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleReply}
                    loading={replying}
                    disabled={!replyText.trim()}
                  >
                    Send Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
