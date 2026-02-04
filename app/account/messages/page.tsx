'use client';

import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Inbox } from 'lucide-react';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, addDoc, getDocs, Timestamp } from 'firebase/firestore';

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
  const [tenant, setTenant] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

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
            // Collection might not exist yet
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

  const handleSendMessage = async () => {
    if (!subject.trim() || !message.trim() || !tenant?.id) return;

    setSending(true);
    try {
      const db = getDb();
      const newMessage = {
        tenantId: tenant.id,
        tenantName: tenant.businessName,
        subject: subject.trim(),
        message: message.trim(),
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
      setSubject('');
      setMessage('');
      setShowNewMessage(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">No tenant found for your account.</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Support Messages"
        subtitle="Contact our support team or view your message history"
        action={
          <Button
            variant="primary"
            onClick={() => setShowNewMessage(!showNewMessage)}
          >
            <Send className="w-4 h-4" />
            New Message
          </Button>
        }
      />

      {/* New Message Form */}
      {showNewMessage && (
        <Card className="border-brand-200 shadow-md">
          <CardHeader>
            <CardTitle>Send a Message</CardTitle>
            <CardDescription>
              Our support team typically responds within 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                rows={6}
                placeholder="Please provide as much detail as possible..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewMessage(false);
                setSubject('');
                setMessage('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendMessage}
              disabled={!subject.trim() || !message.trim() || sending}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Messages List */}
      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-full mb-4">
                <Inbox className="w-8 h-8 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-500 mb-4">
                Start a conversation with our support team
              </p>
              <Button
                variant="primary"
                onClick={() => setShowNewMessage(true)}
              >
                <Send className="w-4 h-4" />
                Send Your First Message
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card key={msg.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{msg.subject}</CardTitle>
                      <Badge
                        variant={
                          msg.status === 'responded' ? 'success' :
                          msg.status === 'closed' ? 'default' :
                          'warning'
                        }
                        dot
                      >
                        {msg.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Sent {msg.createdAt instanceof Date
                        ? msg.createdAt.toLocaleDateString()
                        : new Date(msg.createdAt).toLocaleDateString()
                      }
                      {msg.respondedAt && (
                        <span className="ml-2">
                          • Responded {msg.respondedAt instanceof Date
                            ? msg.respondedAt.toLocaleDateString()
                            : new Date(msg.respondedAt).toLocaleDateString()
                          }
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Your message:</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </div>

                {msg.response && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-success-700 mb-1">Support response:</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap bg-success-50 border border-success-200 rounded-md p-3">
                      {msg.response}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help Info */}
      <Card className="bg-info-50 border-info-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-info-500 rounded-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-info-900 mb-1">
                Need immediate help?
              </h3>
              <p className="text-sm text-info-700 mb-2">
                For urgent issues, you can also reach us at:
              </p>
              <div className="space-y-1 text-sm text-info-700">
                <div>
                  <span className="font-medium">Email:</span>{' '}
                  <a href="mailto:support@newsroomaios.com" className="underline hover:text-info-900">
                    support@newsroomaios.com
                  </a>
                </div>
                <div>
                  <span className="font-medium">Response time:</span> Usually within 24 hours
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
