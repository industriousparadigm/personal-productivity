'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { CommitmentList } from './CommitmentList';

interface Commitment {
  id: string;
  who: string;
  what: string;
  when: string;
  status: string;
  snoozeCount: number;
}

interface DailyCheckProps {
  commitments: Commitment[];
  onUpdate: () => void;
}

export function DailyCheck({ commitments, onUpdate }: DailyCheckProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if we should show the modal
    const checkTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const today = now.toDateString();

      // Check if it's 2pm (14:00)
      if (currentHour === 14 && currentMinute === 0) {
        const storedDate = localStorage.getItem('lastDailyCheck');
        if (storedDate !== today) {
          // Check if there are any overdue or due today commitments
          const hasUrgentCommitments = commitments.some(c => {
            const when = new Date(c.when);
            return c.status === 'pending' && (
              when < now || isToday(when)
            );
          });

          if (hasUrgentCommitments) {
            setShowModal(true);
            localStorage.setItem('lastDailyCheck', today);
          }
        }
      }
    };

    // Check immediately
    checkTime();

    // Set up interval to check every minute
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, [commitments]);

  function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  const now = new Date();
  const urgentCommitments = commitments.filter(c => {
    const when = new Date(c.when);
    return c.status === 'pending' && (when < now || isToday(when));
  });

  const allAddressed = urgentCommitments.length === 0;

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-red-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={32} />
              <div>
                <h2 className="text-2xl font-bold">Daily Commitment Check</h2>
                <p className="text-red-100">
                  You have {urgentCommitments.length} commitment{urgentCommitments.length !== 1 ? 's' : ''} that need{urgentCommitments.length === 1 ? 's' : ''} attention
                </p>
              </div>
            </div>
            {allAddressed && (
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-red-700 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {!allAddressed && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
              <p className="text-lg font-semibold text-yellow-800">
                This modal will not close until all overdue and due today commitments are addressed.
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Mark them as done, reschedule them, or snooze them for 1 hour.
              </p>
            </div>
          )}

          <CommitmentList 
            commitments={urgentCommitments}
            onUpdate={() => {
              onUpdate();
              // Check if all commitments are addressed
              setTimeout(() => {
                const remaining = commitments.filter(c => {
                  const when = new Date(c.when);
                  return c.status === 'pending' && (when < now || isToday(when));
                });
                if (remaining.length === 0) {
                  setShowModal(false);
                }
              }, 500);
            }}
          />

          {allAddressed && (
            <div className="mt-6 p-6 bg-green-50 border-2 border-green-400 rounded-lg text-center">
              <p className="text-xl font-semibold text-green-800">
                All commitments addressed! Great job! 
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}