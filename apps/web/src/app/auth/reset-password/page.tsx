'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ResetPasswordContent from './reset-password-content';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}