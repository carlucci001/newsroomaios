/**
 * Seed Sample Leads for Testing the Growth Map
 *
 * Run this to populate the map with realistic sample data:
 * node scripts/seed-sample-leads.js
 */

require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Initialize Firebase with client SDK (no service account needed)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample lead data representing typical reservations
const sampleLeads = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '(512) 555-0123',
    newspaperName: 'Austin Daily Tribune',
    city: 'Austin',
    county: 'Travis County',
    state: 'Texas',
    notes: 'Excited to launch local news for Austin!',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Michael Chen',
    email: 'mchen@example.com',
    phone: '(415) 555-0198',
    newspaperName: 'San Francisco Chronicle',
    city: 'San Francisco',
    county: 'San Francisco County',
    state: 'California',
    notes: 'Looking to cover tech and local business',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily.r@example.com',
    phone: '(305) 555-0167',
    newspaperName: 'Miami Beach News',
    city: 'Miami',
    county: 'Miami-Dade County',
    state: 'Florida',
    notes: '',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'David Thompson',
    email: 'dthompson@example.com',
    phone: '(206) 555-0145',
    newspaperName: 'Seattle Times',
    city: 'Seattle',
    county: 'King County',
    state: 'Washington',
    notes: 'Community journalism focused on neighborhoods',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Jessica Martinez',
    email: 'jmartinez@example.com',
    phone: '(602) 555-0189',
    newspaperName: 'Phoenix Sun',
    city: 'Phoenix',
    county: 'Maricopa County',
    state: 'Arizona',
    notes: 'Focus on local sports and events',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Robert Williams',
    email: 'rwilliams@example.com',
    phone: '(617) 555-0134',
    newspaperName: 'Boston Herald',
    city: 'Boston',
    county: 'Suffolk County',
    state: 'Massachusetts',
    notes: '',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Amanda Davis',
    email: 'adavis@example.com',
    phone: '(303) 555-0176',
    newspaperName: 'Denver Post',
    city: 'Denver',
    county: 'Denver County',
    state: 'Colorado',
    notes: 'Mountain communities coverage',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'James Wilson',
    email: 'jwilson@example.com',
    phone: '(404) 555-0156',
    newspaperName: 'Atlanta Journal',
    city: 'Atlanta',
    county: 'Fulton County',
    state: 'Georgia',
    notes: 'Local business and culture',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Lisa Anderson',
    email: 'landerson@example.com',
    phone: '(612) 555-0143',
    newspaperName: 'Minneapolis Star',
    city: 'Minneapolis',
    county: 'Hennepin County',
    state: 'Minnesota',
    notes: '',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Christopher Brown',
    email: 'cbrown@example.com',
    phone: '(503) 555-0192',
    newspaperName: 'Portland Observer',
    city: 'Portland',
    county: 'Multnomah County',
    state: 'Oregon',
    notes: 'Environmental and sustainability focus',
    status: 'reserved',
    source: 'sample_data'  // Mark as sample so we can identify it
  },
  {
    name: 'Jennifer Taylor',
    email: 'jtaylor@example.com',
    phone: '(214) 555-0188',
    newspaperName: 'Dallas Morning News',
    city: 'Dallas',
    county: 'Dallas County',
    state: 'Texas',
    notes: '',
    status: 'reserved',
    source: 'sample_data'
  },
  {
    name: 'Kevin Garcia',
    email: 'kgarcia@example.com',
    phone: '(702) 555-0165',
    newspaperName: 'Las Vegas Review',
    city: 'Las Vegas',
    county: 'Clark County',
    state: 'Nevada',
    notes: 'Entertainment and tourism coverage',
    status: 'reserved',
    source: 'sample_data'
  },
  {
    name: 'Michelle Lee',
    email: 'mlee@example.com',
    phone: '(212) 555-0199',
    newspaperName: 'Manhattan Times',
    city: 'New York',
    county: 'New York County',
    state: 'New York',
    notes: 'Urban living and local culture',
    status: 'reserved',
    source: 'sample_data'
  },
  {
    name: 'Daniel White',
    email: 'dwhite@example.com',
    phone: '(312) 555-0177',
    newspaperName: 'Chicago Tribune',
    city: 'Chicago',
    county: 'Cook County',
    state: 'Illinois',
    notes: '',
    status: 'reserved',
    source: 'sample_data'
  },
  {
    name: 'Rachel Green',
    email: 'rgreen@example.com',
    phone: '(713) 555-0154',
    newspaperName: 'Houston Chronicle',
    city: 'Houston',
    county: 'Harris County',
    state: 'Texas',
    notes: 'Energy sector and local business',
    status: 'reserved',
    source: 'sample_data'
  }
];

async function seedLeads() {
  console.log('🌱 Seeding sample leads...\n');

  try {
    const now = new Date();

    for (let i = 0; i < sampleLeads.length; i++) {
      const lead = sampleLeads[i];

      // Create varied timestamps - spread over past 30 days
      // More recent activity = more realistic growth
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);

      const timestamp = new Date(
        now.getTime() -
        (daysAgo * 24 * 60 * 60 * 1000) -
        (hoursAgo * 60 * 60 * 1000) -
        (minutesAgo * 60 * 1000)
      );

      // Add timestamp
      const leadData = {
        ...lead,
        createdAt: timestamp,
        isSample: true  // Mark as sample data
      };

      // Create lead
      const leadRef = await addDoc(collection(db, 'leads'), leadData);
      console.log(`✅ Created lead: ${lead.name} - ${lead.city}, ${lead.state} (${daysAgo}d ago)`);

      // Create corresponding activity with same timestamp
      await addDoc(collection(db, 'activities'), {
        type: 'reservation',
        leadId: leadRef.id,
        newspaperName: lead.newspaperName || 'New Territory',
        city: lead.city,
        state: lead.state,
        timestamp: timestamp,
        message: `🎯 ${lead.name} just reserved ${lead.city}, ${lead.state}!`,
        isSample: true
      });
    }

    console.log(`\n✨ Successfully seeded ${sampleLeads.length} sample leads!`);
    console.log('🗺️  Visit http://localhost:3000/growth-map to see them!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding leads:', error);
    process.exit(1);
  }
}

seedLeads();
