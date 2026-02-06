import { Construction, Clock, Mail } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue-50 via-background to-brand-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center">
          {/* Logo/Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-brand-blue-600 mb-8 animate-pulse">
            <Construction className="w-12 h-12 text-white" />
          </div>

          {/* Main Message */}
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-foreground">
            We'll Be Right Back
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            We're making some improvements to bring you an even better experience.
          </p>

          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-brand-blue-100 p-8 mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-brand-blue-600" />
              <span className="text-lg font-semibold text-brand-blue-600">
                Scheduled Maintenance
              </span>
            </div>
            <p className="text-muted-foreground mb-6">
              Our platform is currently undergoing scheduled maintenance. We expect to be back online shortly.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>Questions? Contact us at support@newsroomaios.com</span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-brand-blue-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-brand-blue-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>

          {/* Footer */}
          <p className="mt-12 text-sm text-muted-foreground">
            Thank you for your patience!
          </p>
        </div>
      </div>
    </div>
  );
}
