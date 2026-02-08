'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { PREDEFINED_CATEGORIES } from '@/data/categories';
import { ServiceArea } from '@/types/tenant';
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Rocket, CreditCard, Check, AlertTriangle, Home, Key, Copy, ExternalLink } from 'lucide-react';

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
      <PaymentElement onReady={() => setIsReady(true)} />
      <Button type="submit" disabled={!stripe || !isReady || loading} className="w-full" size="lg">
        <CreditCard className="h-4 w-4 mr-2" />
        {loading ? 'Processing...' : isReady ? 'Pay & Continue' : 'Loading...'}
      </Button>
    </form>
  );
}

interface OnboardingContentProps {
  onSuccess: (tenantId: string) => void;
  onBack?: () => void;
}

export function OnboardingContent({ onSuccess, onBack }: OnboardingContentProps) {
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
    domainOption: 'have' as 'have' | 'check' | 'help',
    domain: '',
    serviceArea: { city: '', state: '', region: '' } as ServiceArea,
    selectedCategories: [] as string[],
    selectedPlan: 'growth',
  });

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
      setCurrentStep(7);
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
    if (currentStep === 1 && (!formData.newspaperName || !formData.ownerEmail || !formData.domain)) {
      setError('Please fill in all required fields');
      return;
    }
    if (currentStep === 2 && (!formData.serviceArea.city || !formData.serviceArea.state)) {
      setError('Please enter city and state');
      return;
    }
    if (currentStep === 3 && formData.selectedCategories.length !== 6) {
      setError('Please select exactly 6 categories');
      return;
    }
    setError('');
    if (currentStep === 5) {
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
    setCurrentStep(7);
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
          domain: formData.domain,
          serviceArea: formData.serviceArea,
          selectedCategories: selectedCategoryObjects,
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
        setCurrentStep(8); // Move to credentials/launch step
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
            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center font-semibold transition-colors text-sm md:text-base ${
                    step === currentStep
                      ? 'bg-brand-blue-600 text-white shadow-lg shadow-brand-blue-500/30'
                      : step < currentStep
                      ? 'bg-brand-blue-100 text-brand-blue-700'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step < currentStep ? <Check className="h-4 w-4 md:h-5 md:w-5" /> : step}
                </div>
                {step < 8 && (
                  <div className={`w-2 md:w-6 h-1 ${step < currentStep ? 'bg-brand-blue-200' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground font-medium">
            Step {currentStep} of 8: {
              currentStep === 1 ? 'Basic Info' :
              currentStep === 2 ? 'Service Area' :
              currentStep === 3 ? 'Categories' :
              currentStep === 4 ? 'Review' :
              currentStep === 5 ? 'Select Plan' :
              currentStep === 6 ? 'Payment' :
              currentStep === 7 ? 'Launch' : 'Your Credentials'
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
              {currentStep === 3 && 'Select Categories'}
              {currentStep === 4 && 'Review Your Setup'}
              {currentStep === 5 && 'Choose Your Plan'}
              {currentStep === 6 && 'Complete Payment'}
              {currentStep === 7 && 'Launch Your Newspaper'}
              {currentStep === 8 && 'Your Newspaper is Ready!'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Enter your newspaper details and domain'}
              {currentStep === 2 && 'Define the geographic area your newspaper will serve'}
              {currentStep === 3 && 'Pick exactly 6 categories for your news sections'}
              {currentStep === 4 && 'Review your selections before payment'}
              {currentStep === 5 && 'Select the plan that fits your needs'}
              {currentStep === 6 && 'Enter your payment details to complete setup'}
              {currentStep === 7 && 'Your payment is complete. Launch your newspaper!'}
              {currentStep === 8 && 'Save your admin credentials and access your newspaper'}
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
                    placeholder="Mountain View Times"
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
                  <Label className="text-base mb-4 block">Domain Option *</Label>
                  <RadioGroup
                    value={formData.domainOption}
                    onValueChange={(value: 'have' | 'check' | 'help') => setFormData({ ...formData, domainOption: value })}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-4">
                      <RadioGroupItem value="have" id="have" />
                      <Label htmlFor="have" className="cursor-pointer flex-1">I already have a domain</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4">
                      <RadioGroupItem value="check" id="check" />
                      <Label htmlFor="check" className="cursor-pointer flex-1">Check if domain is available</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4">
                      <RadioGroupItem value="help" id="help" />
                      <Label htmlFor="help" className="cursor-pointer flex-1">Help me find a domain</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="domain" className="text-base">Domain Name *</Label>
                  <Input
                    id="domain"
                    placeholder="mountainviewtimes.com"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="mt-2"
                  />
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

            {/* Step 3: Category Selection */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">Selected: {formData.selectedCategories.length} / 6</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                  {PREDEFINED_CATEGORIES.map((category) => (
                    <div
                      key={category.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.selectedCategories.includes(category.id) ? 'bg-brand-blue-50 border-brand-blue-600' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox checked={formData.selectedCategories.includes(category.id)} onCheckedChange={() => toggleCategory(category.id)} />
                        <div className="flex-1">
                          <div className="font-semibold">{category.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{category.directive.substring(0, 60)}...</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold">Your Newspaper Setup:</h3>
                <div className="grid gap-4 text-sm">
                  <div><div className="text-muted-foreground">Name:</div><div className="font-medium">{formData.newspaperName}</div></div>
                  <div><div className="text-muted-foreground">Email:</div><div className="font-medium">{formData.ownerEmail}</div></div>
                  <div><div className="text-muted-foreground">Domain:</div><div className="font-medium">{formData.domain}</div></div>
                  <div><div className="text-muted-foreground">Service Area:</div><div className="font-medium">{formData.serviceArea.city}, {formData.serviceArea.state}</div></div>
                  <div><div className="text-muted-foreground">Categories:</div><div className="font-medium">{formData.selectedCategories.map(id => PREDEFINED_CATEGORIES.find(c => c.id === id)?.name).join(', ')}</div></div>
                </div>
              </div>
            )}

            {/* Step 5: Plan Selection */}
            {currentStep === 5 && (
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

            {/* Step 6: Payment */}
            {currentStep === 6 && (
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

            {/* Step 7: Launch */}
            {currentStep === 7 && paymentComplete && !launchComplete && (
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
                    <div><div className="text-muted-foreground">Domain:</div><div className="font-medium">{formData.domain}</div></div>
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

            {/* Step 8: Credentials & Launch Options */}
            {currentStep === 8 && launchComplete && (
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
        {currentStep !== 6 && currentStep !== 7 && currentStep !== 8 && (
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
