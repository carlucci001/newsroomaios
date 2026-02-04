# Admin UI Components Guide

Your Newsroom AIOS back office now has a complete, professional UI system with charts, data tables, and real-time chat!

## What's Been Installed

### 1. **shadcn/ui Components** (Premium UI Library)
Professional, accessible React components built on Radix UI:
- Tables with sorting, filtering, pagination
- Dropdown menus, dialogs, sheets (side panels)
- Forms (select, textarea, input)
- Scroll areas, separators, avatars
- Toast notifications (via Sonner)

### 2. **Tremor** (Dashboard & Charts Library)
Beautiful, responsive charts and data visualization:
- Area charts (trend analysis)
- Bar charts (comparisons)
- Donut charts (distributions)
- Built-in responsive design
- Automatic data formatting

### 3. **Chat UI Components** (@chatscope/chat-ui-kit-react)
Professional messaging interface for paper partner communications.

## New Components Created

### 📊 AnalyticsChart
Location: `src/components/admin/AnalyticsChart.tsx`

Beautiful charts with Tremor for your dashboard.

**Usage:**
```tsx
import { AnalyticsChart } from '@/components/admin/AnalyticsChart';

<AnalyticsChart
  type="area"  // or "bar" or "donut"
  title="Credit Usage Over Time"
  description="Monthly credit consumption"
  data={[
    { date: 'Jan', credits: 4500, revenue: 450 },
    { date: 'Feb', credits: 5200, revenue: 520 },
  ]}
  categories={['credits', 'revenue']}
  index="date"
  colors={['blue', 'green']}
  valueFormatter={(val) => `${val.toLocaleString()} credits`}
/>
```

**Chart Types:**
- **area**: Trend analysis over time
- **bar**: Compare values across categories
- **donut**: Show distribution/percentages

### 📋 PaperPartnersTable
Location: `src/components/admin/PaperPartnersTable.tsx`

Feature-rich data table for managing paper partners.

**Features:**
- Search functionality
- Status filtering
- Sortable columns
- Dropdown actions menu
- Responsive design
- Credit status indicators

**Usage:**
```tsx
import { PaperPartnersTable } from '@/components/admin/PaperPartnersTable';

<PaperPartnersTable
  partners={partners}
  onViewDetails={(id) => router.push(`/admin/partners/${id}`)}
  onEdit={(id) => console.log('Edit:', id)}
  onDelete={(id) => console.log('Delete:', id)}
  onSendMessage={(id) => openChat(id)}
/>
```

**Partner Data Structure:**
```typescript
interface PaperPartner {
  id: string;
  businessName: string;
  domain: string;
  status: 'active' | 'trial' | 'suspended' | 'seeding';
  licensingStatus: 'trial' | 'paid' | 'suspended';
  creditsRemaining: number;
  monthlyAllocation: number;
  lastActive?: Date;
  contactEmail: string;
}
```

### 💬 PaperPartnerChat
Location: `src/components/admin/PaperPartnerChat.tsx`

Full-featured chat interface for real-time partner communications.

**Features:**
- Conversation list with search
- Real-time messaging
- Read receipts (single/double check marks)
- Online status indicators
- File attachment support (UI ready)
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Auto-scroll to latest message

**Usage:**
```tsx
import { PaperPartnerChat } from '@/components/admin/PaperPartnerChat';

<PaperPartnerChat
  conversations={conversations}
  currentUserId="admin"
  onSendMessage={(conversationId, message) => {
    // Handle sending message to backend
    sendMessageToFirebase(conversationId, message);
  }}
/>
```

**Conversation Data Structure:**
```typescript
interface Conversation {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerStatus: 'online' | 'offline' | 'away';
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'admin' | 'partner';
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: { name: string; url: string }[];
}
```

## Example Page

See a complete working example at:
**`app/admin/analytics/page.tsx`**

This page demonstrates:
- Multiple chart types (area, bar, donut)
- Data table with filtering and sorting
- Chat in a slide-out panel
- Tab navigation
- Responsive layout

**To view it:**
1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/admin/analytics`

## Available shadcn/ui Components

You now have access to these components in `src/components/ui/`:

| Component | Purpose | Import |
|-----------|---------|--------|
| **table** | Data tables | `@/components/ui/table` |
| **dropdown-menu** | Action menus | `@/components/ui/dropdown-menu` |
| **dialog** | Modal dialogs | `@/components/ui/dialog` |
| **sheet** | Side panels | `@/components/ui/sheet` |
| **select** | Dropdowns | `@/components/ui/select` |
| **textarea** | Multi-line input | `@/components/ui/textarea` |
| **scroll-area** | Scrollable content | `@/components/ui/scroll-area` |
| **separator** | Visual dividers | `@/components/ui/separator` |
| **sonner** | Toast notifications | `@/components/ui/sonner` |
| **button** | Buttons | `@/components/ui/button` |
| **card** | Content containers | `@/components/ui/card` |
| **input** | Text inputs | `@/components/ui/input` |
| **badge** | Status indicators | `@/components/ui/badge` |

## Using Tremor Charts

Tremor provides additional chart types beyond what's in AnalyticsChart:

```tsx
import { LineChart, BarChart, AreaChart, DonutChart } from '@tremor/react';

// Line Chart Example
<LineChart
  className="h-80"
  data={data}
  index="date"
  categories={["Sales", "Profit"]}
  colors={["emerald", "gray"]}
  valueFormatter={(number) => `$${number.toLocaleString()}`}
  yAxisWidth={60}
/>
```

Available chart types:
- `AreaChart` - Filled area trends
- `BarChart` - Vertical bars
- `LineChart` - Line graphs
- `DonutChart` - Pie charts
- `BarList` - Horizontal bar lists
- `ScatterChart` - X/Y plotting

[Full Tremor Documentation](https://tremor.so/docs/getting-started/installation)

## Best Practices

### 1. **Chart Colors**
Use your brand colors from `tailwind.config.ts`:
```tsx
colors={['blue', 'indigo', 'violet', 'cyan']}
```

### 2. **Data Formatting**
Always provide a `valueFormatter` for readable charts:
```tsx
valueFormatter={(value) => `$${value.toLocaleString()}`}  // Money
valueFormatter={(value) => `${value.toLocaleString()} credits`}  // Credits
valueFormatter={(value) => `${value}%`}  // Percentages
```

### 3. **Responsive Design**
- Charts automatically resize
- Tables scroll horizontally on mobile
- Chat uses Sheet component for mobile-friendly slide-out

### 4. **Loading States**
Add loading states for better UX:
```tsx
{loading ? (
  <div className="animate-spin h-8 w-8 border-2 border-brand-600" />
) : (
  <AnalyticsChart {...props} />
)}
```

### 5. **Error Handling**
Wrap data fetching in try-catch:
```tsx
try {
  const data = await fetchAnalytics();
  setChartData(data);
} catch (error) {
  console.error('Failed to load analytics:', error);
  toast.error('Failed to load analytics');
}
```

## Adding Toast Notifications

```tsx
import { toast } from 'sonner';

// Success
toast.success('Partner added successfully!');

// Error
toast.error('Failed to save changes');

// Info
toast.info('Credit balance updated');

// With action
toast('Message sent', {
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
});
```

Don't forget to add the Toaster component to your layout:
```tsx
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

## Next Steps

### Integrate with Your Backend
Replace the sample data with real Firebase queries:

```tsx
// Example: Fetch partners
useEffect(() => {
  async function fetchPartners() {
    const db = getDb();
    const snapshot = await getDocs(collection(db, 'tenants'));
    const partners = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPartners(partners);
  }
  fetchPartners();
}, []);
```

### Add Real-Time Chat
Connect the chat component to Firebase Realtime Database or Firestore:

```tsx
// Listen for new messages
useEffect(() => {
  const messagesRef = ref(database, `conversations/${conversationId}/messages`);
  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const messages = [];
    snapshot.forEach((child) => {
      messages.push({ id: child.key, ...child.val() });
    });
    setMessages(messages);
  });
  return unsubscribe;
}, [conversationId]);
```

### Customize Components
All components are in your codebase - customize them as needed:
- Change colors in `tailwind.config.ts`
- Modify component styles directly
- Add new features to tables, charts, or chat

## Need Help?

- **shadcn/ui Docs**: https://ui.shadcn.com
- **Tremor Docs**: https://tremor.so/docs
- **Radix UI**: https://radix-ui.com (underlying primitives)

All components are fully typed with TypeScript for autocomplete and type safety!
