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
    newspaperName: 'Round Rock Reporter',
    city: 'Round Rock',
    county: 'Williamson County',
    state: 'Texas',
    notes: 'Excited to launch local news!',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Michael Chen',
    email: 'mchen@example.com',
    phone: '(415) 555-0198',
    newspaperName: 'Napa Valley Press',
    city: 'Napa',
    county: 'Napa County',
    state: 'California',
    notes: 'Looking to cover local business',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily.r@example.com',
    phone: '(305) 555-0167',
    newspaperName: 'Key West Beacon',
    city: 'Key West',
    county: 'Monroe County',
    state: 'Florida',
    notes: '',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'David Thompson',
    email: 'dthompson@example.com',
    phone: '(206) 555-0145',
    newspaperName: 'Olympia Community News',
    city: 'Olympia',
    county: 'Thurston County',
    state: 'Washington',
    notes: 'Community journalism focused on neighborhoods',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Jessica Martinez',
    email: 'jmartinez@example.com',
    phone: '(602) 555-0189',
    newspaperName: 'Flagstaff Daily',
    city: 'Flagstaff',
    county: 'Coconino County',
    state: 'Arizona',
    notes: 'Focus on local sports and events',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Robert Williams',
    email: 'rwilliams@example.com',
    phone: '(617) 555-0134',
    newspaperName: 'Cape Cod Reporter',
    city: 'Barnstable',
    county: 'Barnstable County',
    state: 'Massachusetts',
    notes: '',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Amanda Davis',
    email: 'adavis@example.com',
    phone: '(303) 555-0176',
    newspaperName: 'Fort Collins Dispatch',
    city: 'Fort Collins',
    county: 'Larimer County',
    state: 'Colorado',
    notes: 'Mountain communities coverage',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'James Wilson',
    email: 'jwilson@example.com',
    phone: '(404) 555-0156',
    newspaperName: 'Savannah Local',
    city: 'Savannah',
    county: 'Chatham County',
    state: 'Georgia',
    notes: 'Local business and culture',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Lisa Anderson',
    email: 'landerson@example.com',
    phone: '(612) 555-0143',
    newspaperName: 'Duluth Northshore News',
    city: 'Duluth',
    county: 'St. Louis County',
    state: 'Minnesota',
    notes: '',
    status: 'reserved',
    source: 'website_reservation'
  },
  {
    name: 'Christopher Brown',
    email: 'cbrown@example.com',
    phone: '(503) 555-0192',
    newspaperName: 'Bend Bulletin',
    city: 'Bend',
    county: 'Deschutes County',
    state: 'Oregon',
    notes: 'Environmental and sustainability focus',
    status: 'reserved',
    source: 'sample_data'  // Mark as sample so we can identify it
  },
  {
    name: 'Jennifer Taylor',
    email: 'jtaylor@example.com',
    phone: '(214) 555-0188',
    newspaperName: 'McKinney Courier',
    city: 'McKinney',
    county: 'Collin County',
    state: 'Texas',
    notes: '',
    status: 'reserved',
    source: 'sample_data'
  },
  {
    name: 'Kevin Garcia',
    email: 'kgarcia@example.com',
    phone: '(702) 555-0165',
    newspaperName: 'Henderson Home News',
    city: 'Henderson',
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
    newspaperName: 'Ithaca Voice',
    city: 'Ithaca',
    county: 'Tompkins County',
    state: 'New York',
    notes: 'Urban living and local culture',
    status: 'reserved',
    source: 'sample_data'
  },
  {
    name: 'Daniel White',
    email: 'dwhite@example.com',
    phone: '(312) 555-0177',
    newspaperName: 'Naperville Sun',
    city: 'Naperville',
    county: 'DuPage County',
    state: 'Illinois',
    notes: '',
    status: 'reserved',
    source: 'sample_data'
  },
  {
    name: 'Rachel Green',
    email: 'rgreen@example.com',
    phone: '(713) 555-0154',
    newspaperName: 'Galveston Gazette',
    city: 'Galveston',
    county: 'Galveston County',
    state: 'Texas',
    notes: 'Coastal community coverage',
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
