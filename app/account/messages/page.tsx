'use client';

import 'antd/dist/reset.css';
import { useState, useEffect } from 'react';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Button,
  Input,
  Space,
  Tag,
  Spin,
  Empty,
  List,
  message as antMessage,
  Form,
} from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  MailOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Message {
  id: string;
  subject: string;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  response?: string;
  createdAt: any;
  respondedAt?: any;
}

export default function MessagesPage() {
  const { isDark } = useTheme();
  const [form] = Form.useForm();
  const [tenant, setTenant] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        const userTenant = await getUserTenant(currentUser.uid);
        setTenant(userTenant);

        // Fetch messages for this tenant
        if (userTenant?.id) {
          const db = getDb();
          try {
            const messagesQuery = query(
              collection(db, 'supportMessages'),
              where('tenantId', '==', userTenant.id),
              orderBy('createdAt', 'desc')
            );
            const messagesSnap = await getDocs(messagesQuery);
            const messagesData = messagesSnap.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
                respondedAt: data.respondedAt?.toDate ? data.respondedAt.toDate() : (data.respondedAt ? new Date(data.respondedAt) : undefined),
              } as Message;
            });
            setMessages(messagesData);
          } catch (e) {
            console.error('Error fetching messages:', e);
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSendMessage = async (values: { subject: string; message: string }) => {
    if (!tenant?.id) return;

    setSending(true);
    try {
      const db = getDb();
      const newMessage = {
        tenantId: tenant.id,
        tenantName: tenant.businessName,
        subject: values.subject.trim(),
        message: values.message.trim(),
        status: 'pending' as const,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'supportMessages'), newMessage);

      // Refresh messages
      const messagesQuery = query(
        collection(db, 'supportMessages'),
        where('tenantId', '==', tenant.id),
        orderBy('createdAt', 'desc')
      );
      const messagesSnap = await getDocs(messagesQuery);
      const messagesData = messagesSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          respondedAt: data.respondedAt?.toDate ? data.respondedAt.toDate() : (data.respondedAt ? new Date(data.respondedAt) : undefined),
        } as Message;
      });
      setMessages(messagesData);

      // Reset form
      form.resetFields();
      setShowNewMessage(false);
      antMessage.success('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      antMessage.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text type="secondary">No tenant found for your account.</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      <Space vertical size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Support Messages
            </Title>
            <Text type="secondary">
              Contact our support team or view your message history
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            onClick={() => setShowNewMessage(!showNewMessage)}
          >
            New Message
          </Button>
        </div>

        {/* New Message Form */}
        {showNewMessage && (
          <Card title={<Title level={4} style={{ margin: 0 }}>Send a Message</Title>}>
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              Our support team typically responds within 24 hours
            </Text>
            <Form
              form={form}
              onFinish={handleSendMessage}
              layout="vertical"
              autoComplete="off"
            >
              <Form.Item
                name="subject"
                label={<Text strong>Subject</Text>}
                rules={[{ required: true, message: 'Please enter a subject' }]}
              >
                <Input
                  placeholder="Brief description of your issue"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="message"
                label={<Text strong>Message</Text>}
                rules={[{ required: true, message: 'Please enter a message' }]}
              >
                <TextArea
                  rows={6}
                  placeholder="Please provide as much detail as possible..."
                  size="large"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button
                    onClick={() => {
                      setShowNewMessage(false);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={sending}
                  >
                    Send Message
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* Messages List */}
        {messages.length === 0 ? (
          <Card>
            <Empty
              image={<InboxOutlined style={{ fontSize: '64px', opacity: 0.3 }} />}
              description={
                <Space vertical size="small">
                  <Title level={4}>No messages yet</Title>
                  <Text type="secondary">Start a conversation with our support team</Text>
                </Space>
              }
            >
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => setShowNewMessage(true)}
              >
                Send Your First Message
              </Button>
            </Empty>
          </Card>
        ) : (
          <Space vertical size="middle" style={{ width: '100%' }}>
            {messages.map((msg) => (
              <Card key={msg.id}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Title level={4} style={{ margin: 0 }}>{msg.subject}</Title>
                      <Tag
                        color={
                          msg.status === 'responded' ? 'success' :
                          msg.status === 'closed' ? 'default' :
                          'warning'
                        }
                      >
                        {msg.status}
                      </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Sent {msg.createdAt instanceof Date
                        ? msg.createdAt.toLocaleDateString()
                        : new Date(msg.createdAt).toLocaleDateString()
                      }
                      {msg.respondedAt && (
                        <span style={{ marginLeft: '8px' }}>
                          • Responded {msg.respondedAt instanceof Date
                            ? msg.respondedAt.toLocaleDateString()
                            : new Date(msg.respondedAt).toLocaleDateString()
                          }
                        </span>
                      )}
                    </Text>
                  </div>
                  <MessageOutlined style={{ fontSize: '20px', opacity: 0.4 }} />
                </div>

                <Space vertical size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '4px' }}>Your message:</Text>
                    <Text style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.message}
                    </Text>
                  </div>

                  {msg.response && (
                    <div style={{ paddingTop: '12px', borderTop: '1px solid', borderColor: isDark ? '#424242' : '#f0f0f0' }}>
                      <Text strong style={{ display: 'block', marginBottom: '4px', color: '#52c41a' }}>Support response:</Text>
                      <Card size="small" style={{ background: isDark ? 'rgba(82, 196, 26, 0.1)' : '#f6ffed', border: '1px solid #b7eb8f' }}>
                        <Text style={{ whiteSpace: 'pre-wrap' }}>
                          {msg.response}
                        </Text>
                      </Card>
                    </div>
                  )}
                </Space>
              </Card>
            ))}
          </Space>
        )}

        {/* Help Info */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#1890ff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <InfoCircleOutlined style={{ fontSize: '20px', color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <Title level={4} style={{ marginTop: 0, marginBottom: '8px' }}>
                Need immediate help?
              </Title>
              <Text style={{ display: 'block', marginBottom: '8px' }}>
                For urgent issues, you can also reach us at:
              </Text>
              <Space vertical size="small">
                <div>
                  <Text strong>Email:</Text>{' '}
                  <a href="mailto:support@newsroomaios.com" style={{ textDecoration: 'underline' }}>
                    support@newsroomaios.com
                  </a>
                </div>
                <div>
                  <Text strong>Response time:</Text> Usually within 24 hours
                </div>
              </Space>
            </div>
          </div>
        </Card>
      </Space>
    </div>
  );
}
