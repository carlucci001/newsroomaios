'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
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
  Form,
  DatePicker,
  Spin,
  message,
  Row,
  Col,
  Statistic,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  UserAddOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  newspaperName?: string;
  city: string;
  county?: string;
  state: string;
  notes?: string;
  status: 'reserved' | 'contacted' | 'qualified' | 'converted' | 'lost';
  createdAt: any;
  updatedAt?: any;
  source: string;
  lastContactedAt?: any;
  adminNotes?: string;
}

interface LeadNote {
  id: string;
  leadId: string;
  note: string;
  createdAt: any;
  createdBy: string;
}

const statusConfig = {
  reserved: { color: 'blue', icon: <ClockCircleOutlined />, label: 'Reserved' },
  contacted: { color: 'orange', icon: <MailOutlined />, label: 'Contacted' },
  qualified: { color: 'purple', icon: <CheckCircleOutlined />, label: 'Qualified' },
  converted: { color: 'green', icon: <CheckCircleOutlined />, label: 'Converted' },
  lost: { color: 'red', icon: <CloseCircleOutlined />, label: 'Lost' },
};

export default function LeadsManagement() {
  const { isDark } = useTheme();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [noteForm] = Form.useForm();

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchText, statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const db = getDb();
      const leadsQuery = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(leadsQuery);
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Lead[];
      setLeads(leadsData);
    } catch (error) {
      console.error('Error fetching leads:', error);
      message.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Apply search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(search) ||
        lead.email.toLowerCase().includes(search) ||
        lead.city.toLowerCase().includes(search) ||
        lead.state.toLowerCase().includes(search) ||
        (lead.newspaperName?.toLowerCase().includes(search) || false)
      );
    }

    setFilteredLeads(filtered);
  };

  const handleUpdateStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const db = getDb();
      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === 'contacted' && { lastContactedAt: serverTimestamp() }),
      });

      setLeads(leads.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
      message.success('Lead status updated');
    } catch (error) {
      console.error('Error updating lead:', error);
      message.error('Failed to update lead status');
    }
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    form.setFieldsValue({
      status: lead.status,
      adminNotes: lead.adminNotes || '',
    });
    setIsModalVisible(true);
  };

  const handleSaveLead = async () => {
    try {
      const values = await form.validateFields();
      const db = getDb();
      const leadRef = doc(db, 'leads', selectedLead!.id);

      await updateDoc(leadRef, {
        status: values.status,
        adminNotes: values.adminNotes,
        updatedAt: serverTimestamp(),
        ...(values.status === 'contacted' && !selectedLead!.lastContactedAt && { lastContactedAt: serverTimestamp() }),
      });

      setLeads(leads.map(lead =>
        lead.id === selectedLead!.id
          ? { ...lead, status: values.status, adminNotes: values.adminNotes }
          : lead
      ));

      message.success('Lead updated successfully');
      setIsModalVisible(false);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error saving lead:', error);
      message.error('Failed to save lead');
    }
  };

  const getStats = () => {
    const total = leads.length;
    const reserved = leads.filter(l => l.status === 'reserved').length;
    const contacted = leads.filter(l => l.status === 'contacted').length;
    const qualified = leads.filter(l => l.status === 'qualified').length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const lost = leads.filter(l => l.status === 'lost').length;

    return { total, reserved, contacted, qualified, converted, lost };
  };

  const stats = getStats();
  const conversionRate = stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : '0';

  const columns: ColumnsType<Lead> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 150,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.newspaperName && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>{record.newspaperName}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <MailOutlined style={{ marginRight: '4px', color: '#8c8c8c' }} />
            <Text style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
          {record.phone && (
            <div>
              <PhoneOutlined style={{ marginRight: '4px', color: '#8c8c8c' }} />
              <Text style={{ fontSize: '12px' }}>{record.phone}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      width: 150,
      render: (_, record) => (
        <div>
          <EnvironmentOutlined style={{ marginRight: '4px', color: '#8c8c8c' }} />
          <Text>{record.city}, {record.state}</Text>
          {record.county && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>{record.county}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: Lead['status']) => {
        const config = statusConfig[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => {
        if (!date) return '-';
        const d = date.toDate ? date.toDate() : new Date(date);
        return (
          <Tooltip title={d.toLocaleString()}>
            <div>
              <CalendarOutlined style={{ marginRight: '4px', color: '#8c8c8c' }} />
              <Text style={{ fontSize: '12px' }}>{dayjs(d).format('MMM D, YYYY')}</Text>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            onClick={() => handleViewLead(record)}
          >
            View Details
          </Button>
          <Select
            value={record.status}
            size="small"
            style={{ width: 120 }}
            onChange={(value) => handleUpdateStatus(record.id, value)}
            options={[
              { value: 'reserved', label: 'Reserved' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'qualified', label: 'Qualified' },
              { value: 'converted', label: 'Converted' },
              { value: 'lost', label: 'Lost' },
            ]}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div>
          <Title level={2} style={{ margin: 0 }}>Leads Management</Title>
          <Text type="secondary">Manage and track potential newspaper partners</Text>
        </div>

        {/* Stats */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic
                title="Total Leads"
                value={stats.total}
                prefix={<UserAddOutlined style={{ color: '#3b82f6' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic
                title="Reserved"
                value={stats.reserved}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic
                title="Contacted"
                value={stats.contacted}
                valueStyle={{ color: '#faad14' }}
                prefix={<MailOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic
                title="Qualified"
                value={stats.qualified}
                valueStyle={{ color: '#722ed1' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic
                title="Converted"
                value={stats.converted}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic
                title="Conversion Rate"
                value={conversionRate}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card>
          <Space size="middle" wrap>
            <Input
              placeholder="Search by name, email, city, or state..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="Filter by status"
              style={{ width: 200 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              options={[
                { value: 'reserved', label: '🕐 Reserved' },
                { value: 'contacted', label: '📧 Contacted' },
                { value: 'qualified', label: '✅ Qualified' },
                { value: 'converted', label: '🎉 Converted' },
                { value: 'lost', label: '❌ Lost' },
              ]}
            />
            <Button
              onClick={() => {
                setSearchText('');
                setStatusFilter(null);
              }}
            >
              Clear Filters
            </Button>
          </Space>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredLeads}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} leads`,
            }}
          />
        </Card>
      </Space>

      {/* Lead Details Modal */}
      <Modal
        title={
          <Space>
            <UserAddOutlined />
            Lead Details
          </Space>
        }
        open={isModalVisible}
        onOk={handleSaveLead}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedLead(null);
        }}
        width={700}
        okText="Save Changes"
      >
        {selectedLead && (
          <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Contact Information */}
              <Card size="small" title="Contact Information">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Name:</Text> <Text>{selectedLead.name}</Text>
                  </div>
                  <div>
                    <Text strong>Email:</Text> <Text>{selectedLead.email}</Text>
                  </div>
                  {selectedLead.phone && (
                    <div>
                      <Text strong>Phone:</Text> <Text>{selectedLead.phone}</Text>
                    </div>
                  )}
                </Space>
              </Card>

              {/* Territory Information */}
              <Card size="small" title="Territory Information">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selectedLead.newspaperName && (
                    <div>
                      <Text strong>Newspaper Name:</Text> <Text>{selectedLead.newspaperName}</Text>
                    </div>
                  )}
                  <div>
                    <Text strong>City:</Text> <Text>{selectedLead.city}</Text>
                  </div>
                  {selectedLead.county && (
                    <div>
                      <Text strong>County:</Text> <Text>{selectedLead.county}</Text>
                    </div>
                  )}
                  <div>
                    <Text strong>State:</Text> <Text>{selectedLead.state}</Text>
                  </div>
                </Space>
              </Card>

              {/* Initial Notes */}
              {selectedLead.notes && (
                <Card size="small" title="Initial Notes from Lead">
                  <Paragraph>{selectedLead.notes}</Paragraph>
                </Card>
              )}

              {/* Admin Form */}
              <Form form={form} layout="vertical">
                <Form.Item
                  label="Status"
                  name="status"
                  rules={[{ required: true, message: 'Please select a status' }]}
                >
                  <Select
                    options={[
                      { value: 'reserved', label: '🕐 Reserved - Just signed up' },
                      { value: 'contacted', label: '📧 Contacted - Reached out' },
                      { value: 'qualified', label: '✅ Qualified - Good fit' },
                      { value: 'converted', label: '🎉 Converted - Paying customer' },
                      { value: 'lost', label: '❌ Lost - Not interested' },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  label="Admin Notes"
                  name="adminNotes"
                  help="Private notes for internal use"
                >
                  <TextArea
                    rows={4}
                    placeholder="Add notes about conversations, follow-ups, etc..."
                  />
                </Form.Item>
              </Form>

              {/* Metadata */}
              <Card size="small" title="Metadata">
                <Space direction="vertical" style={{ width: '100%', fontSize: '12px' }}>
                  <div>
                    <Text type="secondary">Source:</Text> <Tag>{selectedLead.source}</Tag>
                  </div>
                  <div>
                    <Text type="secondary">Created:</Text>{' '}
                    <Text>{selectedLead.createdAt?.toDate?.()?.toLocaleString() || '-'}</Text>
                  </div>
                  {selectedLead.lastContactedAt && (
                    <div>
                      <Text type="secondary">Last Contacted:</Text>{' '}
                      <Text>{selectedLead.lastContactedAt?.toDate?.()?.toLocaleString()}</Text>
                    </div>
                  )}
                </Space>
              </Card>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}
