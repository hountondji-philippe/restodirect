'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoginPageContent from './login-content';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}