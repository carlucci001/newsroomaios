import { Timestamp } from 'firebase/firestore';

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  newspaperName?: string;
  city: string;
  county?: string;
  state: string;
  notes?: string;
  status: 'reserved' | 'contacted' | 'converted' | 'inactive';
  source: 'website_reservation' | 'direct' | 'referral' | 'other';
  siteUrl?: string;
  category?: 'sold' | 'available' | 'pending';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  contactedAt?: Timestamp;
  convertedAt?: Timestamp;
}

export interface LeadActivity {
  id?: string;
  type: 'reservation' | 'launch';
  leadId?: string;
  tenantId?: string;
  newspaperName?: string;
  city: string;
  state: string;
  timestamp: Timestamp;
  message: string;
}
