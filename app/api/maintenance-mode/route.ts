import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const settingsDoc = await getDoc(doc(db, 'settings', 'platform'));

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return NextResponse.json({
        maintenanceMode: data.maintenanceMode === true,
      });
    }

    // Default to false if settings don't exist
    return NextResponse.json({ maintenanceMode: false });
  } catch (error) {
    console.error('Failed to get maintenance mode:', error);
    return NextResponse.json(
      { error: 'Failed to get maintenance mode status' },
      { status: 500 }
    );
  }
}
