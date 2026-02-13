'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PREDEFINED_CATEGORIES } from '@/data/categories';
import { ServiceArea } from '@/types/tenant';
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Rocket, CreditCard, Check, AlertTriangle, Home, Key, Copy, ExternalLink, Loader2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    features: [
      '250 AI credits/month',
      'Up to 50 articles/month',
      'Basic analytics',
      'Email support',
      '+ $199 setup (36 articles, 100 listings, all systems)',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 199,
    features: [
      '575 AI credits/month',
      'Up to 115 articles/month',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      '+ $199 setup (36 articles, 100 listings, all systems)',
    ],
    recommended: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    features: [
      '1,000 AI credits/month',
      'Up to 200 articles/month',
      'Full analytics suite',
      'Dedicated support',
      'AI banner generation',
      '+ $199 setup (36 articles, 100 listings, all systems)',
    ],
  },
];

// 20 curated news categories shown during onboarding (from the full list in categories.ts)
const ONBOARDING_CATEGORY_IDS = [
  'news', 'sports', 'business', 'entertainment', 'lifestyle',
  'health', 'education', 'crime', 'politics', 'real-estate',
  'food-dining', 'outdoors', 'events', 'opinion', 'technology',
  'environment', 'faith', 'history', 'agriculture', 'veterans',
];
const ONBOARDING_CATEGORIES = PREDEFINED_CATEGORIES.filter(c => ONBOARDING_CATEGORY_IDS.includes(c.id));

// 20 directory categories — first 10 are pre-selected (included with every plan)
const DIRECTORY_CATEGORIES = [
  { name: 'Restaurants & Dining', slug: 'restaurants-dining', preselected: true },
  { name: 'Shopping & Retail', slug: 'shopping-retail', preselected: true },
  { name: 'Health & Medical', slug: 'health-medical', preselected: true },
  { name: 'Professional Services', slug: 'professional-services', preselected: true },
  { name: 'Home Services', slug: 'home-services', preselected: true },
  { name: 'Automotive', slug: 'automotive', preselected: true },
  { name: 'Beauty & Wellness', slug: 'beauty-wellness', preselected: true },
  { name: 'Entertainment & Recreation', slug: 'entertainment-recreation', preselected: true },
  { name: 'Real Estate', slug: 'real-estate', preselected: true },
  { name: 'Education & Childcare', slug: 'education-childcare', preselected: true },
  { name: 'Financial Services', slug: 'financial-services', preselected: false },
  { name: 'Pet Services', slug: 'pet-services', preselected: false },
  { name: 'Fitness & Sports', slug: 'fitness-sports', preselected: false },
  { name: 'Hotels & Lodging', slug: 'hotels-lodging', preselected: false },
  { name: 'Religious Organizations', slug: 'religious-organizations', preselected: false },
  { name: 'Nonprofits & Community', slug: 'nonprofits-community', preselected: false },
  { name: 'Government Services', slug: 'government-services', preselected: false },
  { name: 'Technology Services', slug: 'technology-services', preselected: false },
  { name: 'Agriculture & Farm', slug: 'agriculture-farm', preselected: false },
  { name: 'Senior Care', slug: 'senior-care', preselected: false },
];
const DEFAULT_DIRECTORY_SELECTIONS = DIRECTORY_CATEGORIES.filter(c => c.preselected).map(c => c.slug);

function PaymentForm({
  onSuccess,
  onError,
  loading,
  setLoading
}: {
  onSuccess: () => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !isReady) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/?view=onboarding&payment=success` },
      redirect: 'if_required',
    });

    setLoading(false);
    if (error) {
      onError(error.message || 'Payment failed');
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        onReady={() => setIsReady(true)}
        options={{ wallets: { applePay: 'never', googlePay: 'never' } }}
      />
      <Button type="submit" disabled={!stripe || !isReady || loading} className="w-full" size="lg">
        <CreditCard className="h-4 w-4 mr-2" />
        {loading ? 'Processing...' : isReady ? 'Pay & Continue' : 'Loading...'}
      </Button>
    </form>
  );
}

interface OnboardingContentProps {
  onSuccess: (tenantId: string, credentials?: { email: string; temporaryPassword: string }, siteUrl?: string) => void;
  onBack?: () => void;
  initialPlan?: string | null;
}

export function OnboardingContent({ onSuccess, onBack, initialPlan }: OnboardingContentProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState<{ setupFee: number; monthlyFee: number; total: number } | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [newspaperUrl, setNewspaperUrl] = useState<string | null>(null);
  const [launchComplete, setLaunchComplete] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    newspaperName: '',
    ownerEmail: '',
    subdomain: '',
    serviceArea: { city: '', state: '', region: '' } as ServiceArea,
    selectedCategories: ['news', 'sports'] as string[],
    selectedDirectoryCategories: DEFAULT_DIRECTORY_SELECTIONS,
    selectedPlan: initialPlan || 'growth',
  });

  // Subdomain picker state
  const [subdomainEdited, setSubdomainEdited] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);

  // Auto-generate subdomain from newspaper name (until user manually edits it)
  useEffect(() => {
    if (!subdomainEdited && formData.newspaperName) {
      const generated = formData.newspaperName.toLowerCase().replace(/[^a-z0-9]/g, '');
      setFormData(prev => ({ ...prev, subdomain: generated }));
    }
  }, [formData.newspaperName, subdomainEdited]);

  // Debounced slug availability check
  useEffect(() => {
    if (!formData.subdomain || formData.subdomain.length < 3) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const res = await fetch(`/api/tenants/check-slug?slug=${encodeURIComponent(formData.subdomain)}`);
        const data = await res.json();
        setSlugAvailable(data.available ?? false);
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.subdomain]);

  // Restore form data on mount (after payment redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      // Restore form data from localStorage
      const savedData = localStorage.getItem('onboardingFormData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(parsed);
        } catch (e) {
          console.error('Failed to restore form data:', e);
        }
      }
      const savedCustomerId = localStorage.getItem('onboardingCustomerId');
      if (savedCustomerId) setCustomerId(savedCustomerId);
      setPaymentComplete(true);
      setCurrentStep(8);
    }
  }, []);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: formData.selectedPlan,
          email: formData.ownerEmail,
          newspaperName: formData.newspaperName,
        }),
      });
      const result = await response.json();
      if (result.clientSecret) {
        setClientSecret(result.clientSecret);
        setPaymentBreakdown(result.breakdown);
        if (result.customerId) {
          setCustomerId(result.customerId);
          localStorage.setItem('onboardingCustomerId', result.customerId);
        }
      } else {
        setError(result.error || 'Failed to initialize payment');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!formData.newspaperName || !formData.ownerEmail || !formData.subdomain) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.subdomain.length < 3) {
        setError('Subdomain must be at least 3 characters');
        return;
      }
      if (!/^[a-z0-9]+$/.test(formData.subdomain)) {
        setError('Subdomain can only contain lowercase letters and numbers');
        return;
      }
      if (slugChecking) {
        setError('Please wait while we check availability');
        return;
      }
      if (slugAvailable === false) {
        setError('This subdomain is already taken. Please choose a different one.');
        return;
      }
    }
    if (currentStep === 2 && (!formData.serviceArea.city || !formData.serviceArea.state)) {
      setError('Please enter city and state');
      return;
    }
    if (currentStep === 3 && formData.selectedCategories.length !== 6) {
      setError('Please select exactly 6 categories');
      return;
    }
    if (currentStep === 4 && formData.selectedDirectoryCategories.length === 0) {
      setError('Please select at least one directory category');
      return;
    }
    setError('');
    if (currentStep === 6) {
      // Save form data to localStorage before payment (in case of redirect)
      localStorage.setItem('onboardingFormData', JSON.stringify(formData));
      await createPaymentIntent();
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handlePaymentSuccess = () => {
    setPaymentComplete(true);
    setCurrentStep(8);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      const selectedCategoryObjects = PREDEFINED_CATEGORIES.filter(cat =>
        formData.selectedCategories.includes(cat.id)
      );
      const response = await fetch('/api/tenants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.newspaperName,
          ownerEmail: formData.ownerEmail,
          subdomain: formData.subdomain,
          serviceArea: formData.serviceArea,
          selectedCategories: selectedCategoryObjects,
          directoryCategories: formData.selectedDirectoryCategories,
          plan: formData.selectedPlan,
          stripeCustomerId: customerId,
        }),
      });
      const result = await response.json();
      if (result.success) {
        // Create recurring subscription (non-fatal if it fails)
        if (customerId) {
          try {
            await fetch('/api/stripe/create-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerId,
                plan: formData.selectedPlan,
                tenantId: result.tenantId,
              }),
            });
          } catch (subError) {
            console.error('Failed to create subscription:', subError);
          }
        }
        // Clear saved form data after successful launch
        localStorage.removeItem('onboardingFormData');
        localStorage.removeItem('onboardingCustomerId');
        // Store admin credentials, URL, and tenant ID for display
        if (result.adminCredentials) {
          setAdminCredentials(result.adminCredentials);
        }
        setNewspaperUrl(result.newspaperUrl);
        setTenantId(result.tenantId);
        setLaunchComplete(true);
        // Go straight to live status view — customer watches their paper being built
        onSuccess(result.tenantId, result.adminCredentials, result.newspaperUrl);
      } else {
        setError(result.error || 'Failed to create newspaper');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newSelected = formData.selectedCategories.includes(categoryId)
      ? formData.selectedCategories.filter(id => id !== categoryId)
      : [...formData.selectedCategories, categoryId];
    setFormData({ ...formData, selectedCategories: newSelected });
  };

  const toggleDirectoryCategory = (slug: string) => {
    const newSelected = formData.selectedDirectoryCategories.includes(slug)
      ? formData.selectedDirectoryCategories.filter(s => s !== slug)
      : [...formData.selectedDirectoryCategories, slug];
    setFormData({ ...formData, selectedDirectoryCategories: newSelected });
  };

  const selectedPlanData = PLANS.find(p => p.id === formData.selectedPlan);

  return (
    <section className="relative py-16 md:py-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back to Home */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Launch Your <span className="text-brand-blue-600">Newspaper</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete the steps below to set up your AI-powered local newspaper in minutes.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-7 md:w-9 h-7 md:h-9 rounded-full flex items-center justify-center font-semibold transition-colors text-xs md:text-sm ${
                    step === currentStep
                      ? 'bg-brand-blue-600 text-white shadow-lg shadow-brand-blue-500/30'
                      : step < currentStep
                      ? 'bg-brand-blue-100 text-brand-blue-700'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step < currentStep ? <Check className="h-3 w-3 md:h-4 md:w-4" /> : step}
                </div>
                {step < 9 && (
                  <div className={`w-1 md:w-4 h-1 ${step < currentStep ? 'bg-brand-blue-200' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground font-medium">
            Step {currentStep} of 9: {
              currentStep === 1 ? 'Basic Info' :
              currentStep === 2 ? 'Service Area' :
              currentStep === 3 ? 'News Categories' :
              currentStep === 4 ? 'Directory Categories' :
              currentStep === 5 ? 'Review' :
              currentStep === 6 ? 'Select Plan' :
              currentStep === 7 ? 'Payment' :
              currentStep === 8 ? 'Launch' : 'Your Credentials'
            }
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Content */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl font-display">
              {currentStep === 1 && 'Basic Information'}
              {currentStep === 2 && 'Service Area'}
              {currentStep === 3 && 'Select News Categories'}
              {currentStep === 4 && 'Select Directory Categories'}
              {currentStep === 5 && 'Review Your Setup'}
              {currentStep === 6 && 'Choose Your Plan'}
              {currentStep === 7 && 'Complete Payment'}
              {currentStep === 8 && 'Launch Your Newspaper'}
              {currentStep === 9 && 'Your Newspaper is Ready!'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Enter your newspaper details and choose your web address'}
              {currentStep === 2 && 'Define the geographic area your newspaper will serve'}
              {currentStep === 3 && 'Tap to select exactly 6 categories for your news sections'}
              {currentStep === 4 && 'Choose which business directory categories to include (all selected by default)'}
              {currentStep === 5 && 'Review your selections before payment'}
              {currentStep === 6 && 'Select the plan that fits your needs'}
              {currentStep === 7 && 'Enter your payment details to complete setup'}
              {currentStep === 8 && 'Your payment is complete. Launch your newspaper!'}
              {currentStep === 9 && 'Save your admin credentials and access your newspaper'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="newspaperName" className="text-base">Newspaper Name *</Label>
                  <Input
                    id="newspaperName"
                    placeholder="Los Angeles Times"
                    value={formData.newspaperName}
                    onChange={(e) => setFormData({ ...formData, newspaperName: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerEmail" className="text-base">Owner Email *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="owner@example.com"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="subdomain" className="text-base">Your Web Address *</Label>
                  <div className="mt-2 flex items-center">
                    <Input
                      id="subdomain"
                      placeholder="losangeles"
                      value={formData.subdomain}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                        setFormData({ ...formData, subdomain: val });
                        setSubdomainEdited(true);
                      }}
                      className="rounded-r-none border-r-0"
                    />
                    <span className="inline-flex items-center px-2 sm:px-3 h-9 border border-l-0 border-input rounded-r-md bg-muted text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      .newsroomaios.com
                    </span>
                  </div>
                  {formData.subdomain && (
                    <div className="mt-2 text-sm">
                      {formData.subdomain.length < 3 ? (
                        <span className="text-muted-foreground">Must be at least 3 characters</span>
                      ) : !/^[a-z0-9]+$/.test(formData.subdomain) ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          Only lowercase letters and numbers
                        </span>
                      ) : slugChecking ? (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Checking availability...
                        </span>
                      ) : slugAvailable === true ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          {formData.subdomain}.newsroomaios.com is available!
                        </span>
                      ) : slugAvailable === false ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          This name is already taken
                        </span>
                      ) : null}
                    </div>
                  )}
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    This is your newspaper&apos;s web address. You can connect a custom domain (e.g., yournews.com) later from your newspaper&apos;s settings.
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Service Area */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="city" className="text-base">City *</Label>
                  <Input
                    id="city"
                    placeholder="Mountain View"
                    value={formData.serviceArea.city}
                    onChange={(e) => setFormData({ ...formData, serviceArea: { ...formData.serviceArea, city: e.target.value } })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-base">State *</Label>
                  <Input
                    id="state"
                    placeholder="CA"
                    value={formData.serviceArea.state}
                    onChange={(e) => setFormData({ ...formData, serviceArea: { ...formData.serviceArea, state: e.target.value } })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="region" className="text-base">Region / County (Optional)</Label>
                  <Input
                    id="region"
                    placeholder="Santa Clara County"
                    value={formData.serviceArea.region}
                    onChange={(e) => setFormData({ ...formData, serviceArea: { ...formData.serviceArea, region: e.target.value } })}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* Step 3: News Category Selection — Compact Chip/Label UI */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Selected: <span className={formData.selectedCategories.length === 6 ? 'text-green-600 font-semibold' : 'font-semibold'}>{formData.selectedCategories.length}</span> / 6
                  </div>
                  {formData.selectedCategories.length === 6 && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Check className="h-3 w-3" /> Ready</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ONBOARDING_CATEGORIES.map((category) => {
                    const isSelected = formData.selectedCategories.includes(category.id);
                    const isDisabled = !isSelected && formData.selectedCategories.length >= 6;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => !isDisabled && toggleCategory(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                          isSelected
                            ? 'bg-brand-blue-600 text-white border-brand-blue-600 shadow-sm'
                            : isDisabled
                            ? 'bg-muted/30 text-muted-foreground/40 border-muted cursor-not-allowed'
                            : 'bg-white text-foreground border-border hover:border-brand-blue-400 hover:bg-brand-blue-50'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 inline mr-1.5 -mt-0.5" />}
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Directory Category Selection — Compact Chip/Label UI */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Selected: <span className="font-semibold">{formData.selectedDirectoryCategories.length}</span> / {DIRECTORY_CATEGORIES.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = formData.selectedDirectoryCategories.length === DIRECTORY_CATEGORIES.length;
                      setFormData({
                        ...formData,
                        selectedDirectoryCategories: allSelected ? [] : DIRECTORY_CATEGORIES.map(c => c.slug),
                      });
                    }}
                    className="text-xs text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                  >
                    {formData.selectedDirectoryCategories.length === DIRECTORY_CATEGORIES.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your business directory will be pre-populated with 10 local listings per category. You can always add more categories later.
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIRECTORY_CATEGORIES.map((category) => {
                    const isSelected = formData.selectedDirectoryCategories.includes(category.slug);
                    return (
                      <button
                        key={category.slug}
                        type="button"
                        onClick={() => toggleDirectoryCategory(category.slug)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                          isSelected
                            ? 'bg-brand-blue-600 text-white border-brand-blue-600 shadow-sm'
                            : 'bg-white text-foreground border-border hover:border-brand-blue-400 hover:bg-brand-blue-50'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 inline mr-1.5 -mt-0.5" />}
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold">Your Newspaper Setup:</h3>
                <div className="grid gap-4 text-sm">
                  <div><div className="text-muted-foreground">Name:</div><div className="font-medium">{formData.newspaperName}</div></div>
                  <div><div className="text-muted-foreground">Email:</div><div className="font-medium">{formData.ownerEmail}</div></div>
                  <div><div className="text-muted-foreground">Website:</div><div className="font-medium">{formData.subdomain}.newsroomaios.com</div></div>
                  <div><div className="text-muted-foreground">Service Area:</div><div className="font-medium">{formData.serviceArea.city}, {formData.serviceArea.state}</div></div>
                  <div><div className="text-muted-foreground">News Categories:</div><div className="font-medium">{formData.selectedCategories.map(id => PREDEFINED_CATEGORIES.find(c => c.id === id)?.name).join(', ')}</div></div>
                  <div><div className="text-muted-foreground">Directory Categories:</div><div className="font-medium">{formData.selectedDirectoryCategories.map(slug => DIRECTORY_CATEGORIES.find(c => c.slug === slug)?.name).join(', ')}</div></div>
                </div>
              </div>
            )}

            {/* Step 6: Plan Selection */}
            {currentStep === 6 && (
              <div className="space-y-6">
                {/* Value Proposition Callout */}
                <div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 rounded-xl p-6 text-white">
                  <h3 className="font-bold text-xl mb-3">What's Included in Your $199 Setup:</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      ✅ 36 AI-generated articles (ready to publish)<br/>
                      ✅ 100 pre-populated directory listings<br/>
                      ✅ Subdomain with SSL certificate
                    </div>
                    <div>
                      ✅ Complete subscription/paywall system<br/>
                      ✅ Full advertising platform (CPC/CPM)<br/>
                      ✅ Directory monetization tools
                    </div>
                  </div>
                  <p className="mt-4 text-brand-blue-100 text-xs">
                    All revenue systems are included - start earning immediately
                  </p>
                </div>

                <div className="grid gap-4">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        formData.selectedPlan === plan.id ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-muted hover:border-brand-blue-300'
                      } ${plan.recommended ? 'ring-2 ring-brand-blue-600 ring-offset-2' : ''}`}
                      onClick={() => setFormData({ ...formData, selectedPlan: plan.id })}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{plan.name}</h3>
                            {plan.recommended && <span className="bg-brand-blue-600 text-white text-xs px-2 py-1 rounded-full">Recommended</span>}
                          </div>
                          <div className="mt-1"><span className="text-2xl font-bold">${plan.price}</span><span className="text-muted-foreground">/month</span></div>
                          <ul className="mt-3 space-y-1">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-600" />{feature}</li>
                            ))}
                          </ul>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.selectedPlan === plan.id ? 'border-brand-blue-600 bg-brand-blue-600' : 'border-muted'}`}>
                          {formData.selectedPlan === plan.id && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-900">
                  <strong>One-time setup fee:</strong> $199 (includes domain configuration, template setup, and initial content seeding)
                </div>
              </div>
            )}

            {/* Step 7: Payment */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-red-900 mb-1">Important: No Refunds Policy</p>
                      <p className="text-red-800">All payments are <strong>non-refundable</strong> once your newspaper is live.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>One-time setup fee</span><span className="font-medium">${paymentBreakdown?.setupFee || 199}</span></div>
                    <div className="flex justify-between"><span>{selectedPlanData?.name} Plan (first month)</span><span className="font-medium">${paymentBreakdown?.monthlyFee || selectedPlanData?.price}</span></div>
                    <div className="border-t pt-2 mt-2"><div className="flex justify-between text-lg font-semibold"><span>Total Due Today</span><span>${paymentBreakdown?.total || (199 + (selectedPlanData?.price || 0))}</span></div></div>
                  </div>
                </div>
                {clientSecret ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: { theme: 'stripe', variables: { colorPrimary: '#2563eb' } },
                    }}
                  >
                    <PaymentForm onSuccess={handlePaymentSuccess} onError={setError} loading={loading} setLoading={setLoading} />
                  </Elements>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-600 mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Initializing payment...</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 8: Launch */}
            {currentStep === 8 && paymentComplete && !launchComplete && (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
                  <h3 className="text-xl font-semibold text-green-700 mb-2">Payment Successful!</h3>
                  <p className="text-muted-foreground">Your payment has been processed. Click below to launch your newspaper.</p>
                </div>
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold">Final Review:</h3>
                  <div className="grid gap-4 text-sm">
                    <div><div className="text-muted-foreground">Newspaper:</div><div className="font-medium">{formData.newspaperName}</div></div>
                    <div><div className="text-muted-foreground">Website:</div><div className="font-medium">{formData.subdomain}.newsroomaios.com</div></div>
                    <div><div className="text-muted-foreground">Plan:</div><div className="font-medium">{selectedPlanData?.name} - ${selectedPlanData?.price}/month</div></div>
                    <div><div className="text-muted-foreground">Service Area:</div><div className="font-medium">{formData.serviceArea.city}, {formData.serviceArea.state}</div></div>
                  </div>
                </div>
                <div className="text-center py-6">
                  <Button onClick={handleSubmit} size="lg" disabled={loading}>
                    <Rocket className="h-4 w-4 mr-2" />
                    {loading ? 'Creating Your Newspaper...' : 'Launch Newspaper'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 9: Credentials & Launch Options */}
            {currentStep === 9 && launchComplete && (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Rocket className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">Your Newspaper is Live!</h3>
                  <p className="text-muted-foreground">Congratulations! Your AI-powered newspaper has been created.</p>
                </div>

                {/* Complete Business Live! */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-xl text-green-900 mb-3">
                    Your Complete Newspaper Business is Live! 🎉
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-semibold text-green-800">Content Ready</div>
                      <div className="text-green-700">36 articles published</div>
                      <div className="text-green-700">100 directory listings</div>
                    </div>
                    <div>
                      <div className="font-semibold text-green-800">Revenue Systems</div>
                      <div className="text-green-700">Subscriptions active</div>
                      <div className="text-green-700">Ads ready to sell</div>
                    </div>
                    <div>
                      <div className="font-semibold text-green-800">Your Domain</div>
                      <div className="text-green-700">{newspaperUrl?.replace('https://', '') || 'Provisioning...'}</div>
                      <div className="text-green-700">SSL enabled</div>
                    </div>
                  </div>
                </div>

                {/* Admin Credentials */}
                {adminCredentials && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Key className="h-6 w-6 text-amber-600" />
                      <h3 className="font-bold text-lg text-amber-900">Your Admin Login</h3>
                    </div>
                    <div className="bg-white rounded-lg p-5 space-y-4">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email</div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-lg font-semibold">{adminCredentials.email}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(adminCredentials.email)}
                            className="p-2 hover:bg-muted rounded"
                            title="Copy email"
                          >
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Default Password</div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-2xl font-bold text-amber-700">{adminCredentials.temporaryPassword}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(adminCredentials.temporaryPassword)}
                            className="p-2 hover:bg-muted rounded"
                            title="Copy password"
                          >
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-3">
                      <p className="text-sm text-red-800 font-medium">
                        ⚠️ Change your password immediately after logging in!
                      </p>
                    </div>
                  </div>
                )}

                {/* Your Site is Live! */}
                {newspaperUrl && (
                  <div className="bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 rounded-xl p-8 text-white text-center">
                    <h3 className="font-bold text-xl mb-3">Your Site is Live!</h3>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
                      <p className="font-mono text-2xl font-bold">{newspaperUrl.replace('https://', '')}</p>
                    </div>
                    <p className="text-brand-blue-100 text-sm">
                      Your newspaper is now live and accessible to the world.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <a
                    href={newspaperUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-5 px-6 rounded-xl hover:bg-green-700 transition-colors text-lg"
                  >
                    <Rocket className="h-5 w-5" />
                    Go to Your Site
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <a
                    href={newspaperUrl ? `${newspaperUrl}/backend` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-semibold py-5 px-6 rounded-xl hover:bg-brand-blue-700 transition-colors text-lg"
                  >
                    <Key className="h-5 w-5" />
                    Go to Admin
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {currentStep !== 7 && currentStep !== 8 && currentStep !== 9 && (
          <div className="flex items-center justify-between mt-8">
            <Button variant="outline" size="lg" onClick={handlePrevious} disabled={currentStep === 1 || loading}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            <Button size="lg" onClick={handleNext} disabled={loading} className="shadow-lg shadow-brand-blue-500/20">
              {loading ? 'Loading...' : 'Next'} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
