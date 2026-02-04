'use client';

import { useState } from 'react';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { AnalyticsChart } from '@/components/admin/AnalyticsChart';
import { PaperPartnersTable } from '@/components/admin/PaperPartnersTable';
import { PaperPartnerChat } from '@/components/admin/PaperPartnerChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

// Sample data for analytics
const creditUsageData = [
  { date: 'Jan 1', credits: 4500, revenue: 450 },
  { date: 'Jan 8', credits: 5200, revenue: 520 },
  { date: 'Jan 15', credits: 6100, revenue: 610 },
  { date: 'Jan 22', credits: 5800, revenue: 580 },
  { date: 'Jan 29', credits: 7200, revenue: 720 },
  { date: 'Feb 5', credits: 8100, revenue: 810 },
];

const partnersByTier = [
  { name: 'Basic', value: 45, color: 'blue' },
  { name: 'Pro', value: 30, color: 'indigo' },
  { name: 'Enterprise', value: 15, color: 'violet' },
  { name: 'Trial', value: 10, color: 'gray' },
];

const topPartners = [
  { name: 'Daily Herald', credits: 15000 },
  { name: 'City Tribune', credits: 12500 },
  { name: 'Local Gazette', credits: 10200 },
  { name: 'Metro Times', credits: 9800 },
  { name: 'Valley News', credits: 8500 },
];

// Sample partners data
const samplePartners = [
  {
    id: '1',
    businessName: 'Daily Herald',
    domain: 'dailyherald.com',
    status: 'active' as const,
    licensingStatus: 'paid' as const,
    creditsRemaining: 15000,
    monthlyAllocation: 20000,
    lastActive: new Date('2026-02-03'),
    contactEmail: 'admin@dailyherald.com',
  },
  {
    id: '2',
    businessName: 'City Tribune',
    domain: 'citytribune.com',
    status: 'active' as const,
    licensingStatus: 'paid' as const,
    creditsRemaining: 2500,
    monthlyAllocation: 15000,
    lastActive: new Date('2026-02-04'),
    contactEmail: 'editor@citytribune.com',
  },
  {
    id: '3',
    businessName: 'Local Gazette',
    domain: 'localgazette.com',
    status: 'trial' as const,
    licensingStatus: 'trial' as const,
    creditsRemaining: 5000,
    monthlyAllocation: 5000,
    lastActive: new Date('2026-02-02'),
    contactEmail: 'contact@localgazette.com',
  },
  {
    id: '4',
    businessName: 'Metro Times',
    domain: 'metrotimes.com',
    status: 'active' as const,
    licensingStatus: 'paid' as const,
    creditsRemaining: 500,
    monthlyAllocation: 10000,
    lastActive: new Date('2026-02-04'),
    contactEmail: 'support@metrotimes.com',
  },
  {
    id: '5',
    businessName: 'Valley News',
    domain: 'valleynews.com',
    status: 'suspended' as const,
    licensingStatus: 'suspended' as const,
    creditsRemaining: 0,
    monthlyAllocation: 10000,
    lastActive: new Date('2026-01-28'),
    contactEmail: 'info@valleynews.com',
  },
];

// Sample chat conversations
const sampleConversations = [
  {
    id: 'conv-1',
    partnerId: '1',
    partnerName: 'Daily Herald',
    partnerStatus: 'online' as const,
    lastMessage: 'Thanks for the quick response!',
    lastMessageTime: new Date('2026-02-04T10:30:00'),
    unreadCount: 0,
    messages: [
      {
        id: 'msg-1',
        senderId: '1',
        senderName: 'Daily Herald',
        senderType: 'partner' as const,
        content: 'Hi, we need more credits for this month. Can you help?',
        timestamp: new Date('2026-02-04T10:15:00'),
        read: true,
      },
      {
        id: 'msg-2',
        senderId: 'admin',
        senderName: 'Admin',
        senderType: 'admin' as const,
        content: "Of course! I'll add 5,000 credits to your account right away.",
        timestamp: new Date('2026-02-04T10:20:00'),
        read: true,
      },
      {
        id: 'msg-3',
        senderId: '1',
        senderName: 'Daily Herald',
        senderType: 'partner' as const,
        content: 'Thanks for the quick response!',
        timestamp: new Date('2026-02-04T10:30:00'),
        read: true,
      },
    ],
  },
  {
    id: 'conv-2',
    partnerId: '2',
    partnerName: 'City Tribune',
    partnerStatus: 'offline' as const,
    lastMessage: 'When will the new features be available?',
    lastMessageTime: new Date('2026-02-03T16:45:00'),
    unreadCount: 2,
    messages: [
      {
        id: 'msg-4',
        senderId: '2',
        senderName: 'City Tribune',
        senderType: 'partner' as const,
        content: 'When will the new features be available?',
        timestamp: new Date('2026-02-03T16:45:00'),
        read: false,
      },
    ],
  },
  {
    id: 'conv-3',
    partnerId: '3',
    partnerName: 'Local Gazette',
    partnerStatus: 'away' as const,
    lastMessage: 'Our trial is ending soon. What are the pricing options?',
    lastMessageTime: new Date('2026-02-02T14:20:00'),
    unreadCount: 1,
    messages: [
      {
        id: 'msg-5',
        senderId: '3',
        senderName: 'Local Gazette',
        senderType: 'partner' as const,
        content: 'Our trial is ending soon. What are the pricing options?',
        timestamp: new Date('2026-02-02T14:20:00'),
        read: false,
      },
    ],
  },
];

export default function AdminAnalyticsPage() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <PageContainer maxWidth="2xl">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Analytics & Management"
          subtitle="Comprehensive dashboard for managing paper partners"
        />

        {/* Chat Toggle Button */}
        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetTrigger asChild>
            <Button>
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[800px] sm:max-w-[800px]">
            <SheetHeader>
              <SheetTitle>Partner Communications</SheetTitle>
              <SheetDescription>
                Chat with your paper partners in real-time
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <PaperPartnerChat
                conversations={sampleConversations}
                currentUserId="admin"
                onSendMessage={(conversationId, message) => {
                  console.log('Sending message:', conversationId, message);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart
              type="area"
              title="Credit Usage & Revenue"
              description="Track credit consumption and revenue over time"
              data={creditUsageData}
              categories={['credits', 'revenue']}
              index="date"
              colors={['blue', 'green']}
            />

            <AnalyticsChart
              type="donut"
              title="Partners by Tier"
              description="Distribution across subscription tiers"
              data={partnersByTier}
            />
          </div>

          <AnalyticsChart
            type="bar"
            title="Top Partners by Credits"
            description="Highest credit consumers this month"
            data={topPartners}
            categories={['credits']}
            index="name"
            colors={['indigo']}
          />
        </TabsContent>

        <TabsContent value="partners">
          <PaperPartnersTable
            partners={samplePartners}
            onViewDetails={(id) => console.log('View details:', id)}
            onEdit={(id) => console.log('Edit:', id)}
            onDelete={(id) => console.log('Delete:', id)}
            onSendMessage={(id) => {
              console.log('Send message:', id);
              setChatOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <AnalyticsChart
              type="area"
              title="Credit Usage Trends"
              description="30-day credit consumption analysis"
              data={creditUsageData}
              categories={['credits']}
              index="date"
              colors={['blue']}
              valueFormatter={(value) => `${value.toLocaleString()} credits`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnalyticsChart
                type="bar"
                title="Revenue by Week"
                description="Weekly revenue breakdown"
                data={creditUsageData}
                categories={['revenue']}
                index="date"
                colors={['green']}
                valueFormatter={(value) => `$${value.toLocaleString()}`}
              />

              <AnalyticsChart
                type="donut"
                title="Partner Distribution"
                description="Active vs trial vs suspended"
                data={partnersByTier}
                colors={['blue', 'indigo', 'violet', 'gray']}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
