'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { PREDEFINED_CATEGORIES } from '@/data/categories';
import { ServiceArea } from '@/types/tenant';
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Save, Rocket, Link as LinkIcon } from 'lucide-react';

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [newspaperUrl, setNewspaperUrl] = useState('');
  const [resumeToken, setResumeToken] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');

  const [formData, setFormData] = useState({
    newspaperName: '',
    ownerEmail: '',
    domainOption: 'have' as 'have' | 'check' | 'help',
    domain: '',
    serviceArea: {
      city: '',
      state: '',
      region: '',
    } as ServiceArea,
    selectedCategories: [] as string[],
  });

  // Load saved progress on mount if resume token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resume');
    if (token) {
      loadProgress(token);
    }
  }, []);

  const loadProgress = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/onboarding/save?token=${token}`);
      const result = await response.json();

      if (result.success && result.data) {
        setFormData({
          newspaperName: result.data.newspaperName || '',
          ownerEmail: result.data.ownerEmail || '',
          domainOption: result.data.domainOption || 'have',
          domain: result.data.domain || '',
          serviceArea: result.data.serviceArea || { city: '', state: '', region: '' },
          selectedCategories: result.data.selectedCategories || [],
        });
        setCurrentStep(result.data.currentStep || 1);
        setResumeToken(token);
      }
    } catch (err) {
      setError('Failed to load saved progress');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgress = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          currentStep,
          resumeToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResumeToken(result.resumeToken);
        setResumeUrl(`${window.location.origin}${result.resumeUrl}`);
      } else {
        setError(result.error || 'Failed to save progress');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Validation for each step
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
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Get the full category objects for selected IDs
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
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNewspaperUrl(result.newspaperUrl);
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to create newspaper');
      }
    } catch (err) {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step === currentStep
                      ? 'bg-brand-blue-600 text-white'
                      : step < currentStep
                      ? 'bg-brand-blue-200 text-brand-blue-700'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < 6 && (
                  <div
                    className={`w-12 h-1 ${
                      step < currentStep ? 'bg-brand-blue-200' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Step {currentStep} of 6
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Resume URL Display */}
        {resumeUrl && currentStep === 5 && (
          <div className="mb-6 flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">Progress Saved!</div>
              <div className="text-sm mt-1">Resume link: <code className="bg-white px-2 py-1 rounded text-xs">{resumeUrl}</code></div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl font-display">
              {currentStep === 1 && 'Domain Selection'}
              {currentStep === 2 && 'Service Area'}
              {currentStep === 3 && 'Select Categories'}
              {currentStep === 4 && 'Content Seeding'}
              {currentStep === 5 && 'Save & Resume'}
              {currentStep === 6 && 'Launch Your Newspaper'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Choose how you want to set up your domain'}
              {currentStep === 2 && 'Define the geographic area your newspaper will serve'}
              {currentStep === 3 && 'Pick exactly 6 categories for your news sections'}
              {currentStep === 4 && 'Review your selections'}
              {currentStep === 5 && 'Save your progress or continue to launch'}
              {currentStep === 6 && 'Review and launch your newspaper'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Domain Selection */}
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
                    required
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
                    required
                  />
                </div>

                <div>
                  <Label className="text-base mb-4 block">Domain Option *</Label>
                  <RadioGroup
                    value={formData.domainOption}
                    onValueChange={(value: 'have' | 'check' | 'help') =>
                      setFormData({ ...formData, domainOption: value })
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-4">
                      <RadioGroupItem value="have" id="have" />
                      <Label htmlFor="have" className="cursor-pointer flex-1">
                        I already have a domain
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4">
                      <RadioGroupItem value="check" id="check" />
                      <Label htmlFor="check" className="cursor-pointer flex-1">
                        Check if domain is available
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4">
                      <RadioGroupItem value="help" id="help" />
                      <Label htmlFor="help" className="cursor-pointer flex-1">
                        Help me find a domain
                      </Label>
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
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your desired domain name
                  </p>
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
                    onChange={(e) => setFormData({
                      ...formData,
                      serviceArea: { ...formData.serviceArea, city: e.target.value }
                    })}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="state" className="text-base">State *</Label>
                  <Input
                    id="state"
                    placeholder="CA"
                    value={formData.serviceArea.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      serviceArea: { ...formData.serviceArea, state: e.target.value }
                    })}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="region" className="text-base">Region / County (Optional)</Label>
                  <Input
                    id="region"
                    placeholder="Santa Clara County"
                    value={formData.serviceArea.region}
                    onChange={(e) => setFormData({
                      ...formData,
                      serviceArea: { ...formData.serviceArea, region: e.target.value }
                    })}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This helps localize your news content
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Category Selection */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Selected: {formData.selectedCategories.length} / 6
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PREDEFINED_CATEGORIES.map((category) => (
                    <div
                      key={category.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.selectedCategories.includes(category.id)
                          ? 'bg-brand-blue-50 border-brand-blue-600'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={formData.selectedCategories.includes(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                        />
                        <div className="flex-1">
                          <div className="font-semibold">{category.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {category.directive.substring(0, 80)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Content Seeding Preview */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Selected Categories:</h3>
                  <div className="space-y-3">
                    {formData.selectedCategories.map((catId) => {
                      const category = PREDEFINED_CATEGORIES.find(c => c.id === catId);
                      return category ? (
                        <div key={catId} className="border rounded-lg p-4">
                          <div className="font-semibold text-brand-blue-600">{category.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">{category.directive}</div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Phase 2:</strong> AI content seeding will generate 6 articles per category (36 total) based on your service area and category directives.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Save & Resume */}
            {currentStep === 5 && (
              <div className="space-y-6 text-center">
                <div className="py-8">
                  <Save className="h-16 w-16 mx-auto text-brand-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Save Your Progress</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate a unique link to return and complete your setup later
                  </p>
                  <Button onClick={handleSaveProgress} size="lg" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save & Get Resume Link'}
                  </Button>
                </div>
                <div className="border-t pt-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Or continue to the final step to launch your newspaper
                  </p>
                </div>
              </div>
            )}

            {/* Step 6: Deploy & Launch */}
            {currentStep === 6 && !success && (
              <div className="space-y-6">
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold">Review Your Newspaper:</h3>
                  <div className="grid gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Name:</div>
                      <div className="font-medium">{formData.newspaperName}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Domain:</div>
                      <div className="font-medium">{formData.domain}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Service Area:</div>
                      <div className="font-medium">
                        {formData.serviceArea.city}, {formData.serviceArea.state}
                        {formData.serviceArea.region && ` (${formData.serviceArea.region})`}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Categories:</div>
                      <div className="font-medium">
                        {formData.selectedCategories.map(id =>
                          PREDEFINED_CATEGORIES.find(c => c.id === id)?.name
                        ).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center py-6">
                  <Button onClick={handleSubmit} size="lg" disabled={loading}>
                    <Rocket className="h-4 w-4 mr-2" />
                    {loading ? 'Launching...' : 'Launch Newspaper'}
                  </Button>
                </div>
              </div>
            )}

            {/* Success State */}
            {success && (
              <div className="text-center py-8 space-y-6">
                <CheckCircle className="h-20 w-20 mx-auto text-green-600" />
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Newspaper Launched Successfully!</h3>
                  <p className="text-muted-foreground mb-6">
                    Your newspaper has been provisioned and is ready to view
                  </p>
                </div>
                <div className="bg-brand-blue-50 border border-brand-blue-200 p-6 rounded-lg">
                  <div className="text-sm text-brand-blue-900 mb-2">Your Newspaper URL:</div>
                  <div className="flex items-center justify-center gap-2">
                    <LinkIcon className="h-4 w-4 text-brand-blue-600" />
                    <a
                      href={newspaperUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue-600 hover:underline font-mono font-semibold"
                    >
                      {newspaperUrl}
                    </a>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                  <strong>Note:</strong> The newspaper content will be available once Phase 3 (multi-tenant routing) is implemented.
                  For now, the tenant record has been created in Firestore.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {!success && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < 6 && (
              <Button onClick={handleNext} disabled={loading}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
