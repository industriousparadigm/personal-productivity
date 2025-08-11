'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600">Authentication Error</h1>
          <p className="mt-2 text-gray-600">
            {error === 'Verification' 
              ? 'The sign-in link is invalid or has expired.'
              : 'An error occurred during authentication.'}
          </p>
          <Link
            href="/auth/signin"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            Try signing in again
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}