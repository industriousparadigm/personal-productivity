'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { CommitmentForm } from '@/components/CommitmentForm';
import { CommitmentList } from '@/components/CommitmentList';
import { TrustScore } from '@/components/TrustScore';
import { DailyCheck } from '@/components/DailyCheck';
import { CommitmentHistory } from '@/components/CommitmentHistory';
import { LogOut, History, Home as HomeIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Commitment {
  id: string;
  who: string;
  what: string;
  when: string;
  status: string;
  snoozeCount: number;
  createdAt: string;
  completedAt?: string;
  rescheduledAt?: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [commitments, setCommitments] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (session) {
      fetchCommitments();
    }
  }, [session]);

  const fetchCommitments = async () => {
    try {
      const response = await fetch('/api/commitments');
      if (response.ok) {
        const data = await response.json();
        setCommitments(data);
        
        // Count overdue commitments
        const now = new Date();
        const overdue = data.filter((c: Commitment) => {
          const when = new Date(c.when);
          return c.status === 'pending' && when < now;
        });
        setOverdueCount(overdue.length);
      }
    } catch (error) {
      console.error('Failed to fetch commitments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Middleware will redirect to sign-in
  }

  const isBlocked = overdueCount >= 3;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Oathkeeper</h1>
              <p className="text-sm text-gray-600">Stop breaking promises</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overdue banner */}
      {overdueCount > 0 && (
        <div className="bg-red-600 text-white py-3 px-4">
          <div className="max-w-7xl mx-auto text-center font-bold">
            ⚠️ You have {overdueCount} broken promise{overdueCount !== 1 ? 's' : ''}. 
            {isBlocked && ' Fix them before making new commitments.'}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowHistory(false)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
              !showHistory ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            )}
          >
            <HomeIcon size={16} />
            Dashboard
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
              showHistory ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            )}
          >
            <History size={16} />
            History
          </button>
        </div>

        {showHistory ? (
          <CommitmentHistory commitments={commitments} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Trust Score */}
            <div className="lg:col-span-1">
              <TrustScore />
            </div>

            {/* Right column - Commitments */}
            <div className="lg:col-span-2 space-y-8">
              {/* Commitment Form */}
              <div>
                <h2 className="text-xl font-bold mb-4">Add Commitment</h2>
                <CommitmentForm 
                  onCommitmentAdded={fetchCommitments}
                  disabled={isBlocked}
                  disabledMessage={isBlocked ? "You have 3 broken promises. Fix those first." : undefined}
                />
              </div>

              {/* Commitment List */}
              <div>
                <h2 className="text-xl font-bold mb-4">Your Commitments</h2>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading commitments...</div>
                ) : (
                  <CommitmentList 
                    commitments={commitments}
                    onUpdate={fetchCommitments}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Daily Check Modal */}
      <DailyCheck 
        commitments={commitments}
        onUpdate={fetchCommitments}
      />
    </div>
  );
}