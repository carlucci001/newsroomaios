'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface LeadCaptureFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function LeadCaptureForm({ onBack, onSuccess }: LeadCaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    newspaperName: '',
    city: '',
    county: '',
    state: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const db = getDb();

      // Save to Firestore 'leads' collection
      const leadRef = await addDoc(collection(db, 'leads'), {
        ...formData,
        status: 'reserved',
        createdAt: serverTimestamp(),
        source: 'website_reservation'
      });

      // Create activity for the growth map
      await addDoc(collection(db, 'activities'), {
        type: 'reservation',
        leadId: leadRef.id,
        newspaperName: formData.newspaperName || 'New Territory',
        city: formData.city,
        state: formData.state,
        timestamp: serverTimestamp(),
        message: `🎯 ${formData.name} just reserved ${formData.city}, ${formData.state}!`
      });

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Error reserving spot. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20">
        <Card className="border-2 border-brand-blue-500 shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">Spot Reserved! 🎉</h2>
            <p className="text-xl text-muted-foreground mb-4">
              We've reserved your spot for <span className="font-semibold text-brand-blue-600">{formData.city}, {formData.state}</span>
            </p>
            <p className="text-muted-foreground mb-6">
              You'll appear on our live growth map and we'll reach out with next steps. No credit card required!
            </p>
            <div className="bg-brand-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                Check out our <a href="/growth-map" className="text-brand-blue-600 font-semibold hover:underline">Growth Map</a> to see your reservation and watch our expansion across the country!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen bg-background py-12">
      <div className="max-w-3xl mx-auto px-6">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Options
        </Button>

        <Card className="border-2 shadow-xl bg-white">
        <CardHeader className="text-center pb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-blue-500/30">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-display text-foreground">Reserve Your Spot</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Claim your territory on our growth map. Takes 30 seconds. No credit card needed.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Contact Information</h3>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Your Name *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Email *</label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Phone (Optional)</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Territory Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg text-foreground">Territory Details</h3>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Newspaper Name (Optional)</label>
                <Input
                  value={formData.newspaperName}
                  onChange={(e) => handleChange('newspaperName', e.target.value)}
                  placeholder="The Daily Tribune"
                />
                <p className="text-xs text-muted-foreground mt-1">You can always update this later</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">City *</label>
                  <Input
                    required
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Austin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">County (Optional)</label>
                  <Input
                    value={formData.county}
                    onChange={(e) => handleChange('county', e.target.value)}
                    placeholder="Travis County"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">State *</label>
                <Input
                  required
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="Texas"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Additional Notes (Optional)</label>
                <Input
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Any specific interests or questions..."
                />
              </div>
            </div>

            <div className="bg-brand-blue-50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                ✅ No credit card required<br />
                ✅ No commitment<br />
                ✅ Reserve your territory before someone else does
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-lg shadow-lg shadow-brand-blue-500/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Reserving Your Spot...
                </>
              ) : (
                'Reserve My Spot'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
