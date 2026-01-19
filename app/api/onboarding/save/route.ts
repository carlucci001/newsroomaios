import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { OnboardingProgress } from '@/types/tenant';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generate resume token if not exists
    const resumeToken = data.resumeToken || `onboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const progressData: OnboardingProgress = {
      id: resumeToken,
      resumeToken,
      currentStep: data.currentStep,
      domainOption: data.domainOption,
      domain: data.domain,
      serviceArea: data.serviceArea,
      selectedCategories: data.selectedCategories,
      ownerEmail: data.ownerEmail,
      newspaperName: data.newspaperName,
      status: 'in_progress',
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: new Date(),
    };

    const db = getDb();
    await setDoc(doc(collection(db, 'onboardingProgress'), resumeToken), progressData);

    return NextResponse.json({
      success: true,
      resumeToken,
      resumeUrl: `/onboarding?resume=${resumeToken}`,
    });
  } catch (error) {
    console.error('Error saving onboarding progress:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resumeToken = searchParams.get('token');

    if (!resumeToken) {
      return NextResponse.json(
        { error: 'Resume token required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const docRef = doc(db, 'onboardingProgress', resumeToken);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Onboarding session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: docSnap.data(),
    });
  } catch (error) {
    console.error('Error loading onboarding progress:', error);
    return NextResponse.json(
      { error: 'Failed to load progress' },
      { status: 500 }
    );
  }
}