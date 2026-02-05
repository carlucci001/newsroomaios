'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Rocket, CheckCircle2, Clock } from 'lucide-react';

interface OnboardingChoiceProps {
  isOpen: boolean;
  onClose: () => void;
  onReserveSpot: () => void;
  onGetStarted: () => void;
}

export function OnboardingChoice({ isOpen, onClose, onReserveSpot, onGetStarted }: OnboardingChoiceProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Choose Your Path</DialogTitle>
        <DialogDescription className="sr-only">
          Reserve your spot on our growth map or get started with full onboarding today
        </DialogDescription>

        <div className="p-8 bg-gradient-to-br from-brand-blue-50 to-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold mb-3">Choose Your Path</h2>
            <p className="text-lg text-muted-foreground">
              Ready to launch now, or want to reserve your territory first?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Reserve Your Spot */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-xl cursor-pointer group relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-brand-blue-100 text-brand-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                No Credit Card
              </div>
              <CardHeader className="pb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-brand-blue-500/30">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl font-display">Reserve Your Spot</CardTitle>
                <CardDescription className="text-base">
                  Claim your territory on our growth map. No commitment required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Reserve your city/county</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Show on our live growth map</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">No credit card needed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Takes 30 seconds</span>
                  </li>
                </ul>
                <Button
                  onClick={onReserveSpot}
                  variant="outline"
                  className="w-full hover:bg-brand-blue-50 hover:border-brand-blue-500"
                  size="lg"
                >
                  Reserve My Spot
                </Button>
              </CardContent>
            </Card>

            {/* Get Started Today */}
            <Card className="border-2 border-brand-blue-500 shadow-xl transition-all hover:shadow-2xl cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-blue-500 to-brand-blue-600" />
              <div className="absolute top-4 right-4 bg-brand-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Recommended
              </div>
              <CardHeader className="pb-4 pt-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-brand-blue-500/30">
                  <Rocket className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl font-display">Get Started Today</CardTitle>
                <CardDescription className="text-base">
                  Complete setup and launch your newspaper immediately.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Full onboarding wizard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Set up your newspaper details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Configure categories & billing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Go live immediately</span>
                  </li>
                </ul>
                <Button
                  onClick={onGetStarted}
                  className="w-full shadow-lg shadow-brand-blue-500/30"
                  size="lg"
                >
                  Start Setup Now
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Not sure? Reserve your spot first—you can always upgrade to full setup later.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
