'use client';

import { useState } from 'react';
import { formatCommitmentDate, getDaysOverdue } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { Check, Calendar, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Commitment {
  id: string;
  who: string;
  what: string;
  when: string;
  status: string;
  snoozeCount: number;
}

interface CommitmentListProps {
  commitments: Commitment[];
  onUpdate: () => void;
}

export function CommitmentList({ commitments, onUpdate }: CommitmentListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<{ id: string; who: string; what: string } | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const now = new Date();
  const overdue = commitments.filter(c => {
    const when = new Date(c.when);
    return c.status === 'pending' && when < now && !isToday(when);
  });
  const today = commitments.filter(c => {
    const when = new Date(c.when);
    return c.status === 'pending' && isToday(when);
  });
  const upcoming = commitments.filter(c => {
    const when = new Date(c.when);
    return c.status === 'pending' && when > now && !isToday(when);
  });

  function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  const handleComplete = async (id: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/commitments?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) throw new Error('Failed to complete commitment');
      
      toast.success('Commitment completed!');
      onUpdate();
    } catch {
      toast.error('Failed to complete commitment');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSnooze = async (id: string, currentSnoozeCount: number) => {
    if (currentSnoozeCount >= 2) {
      toast.error('Maximum snoozes reached');
      return;
    }

    setUpdatingId(id);
    try {
      const response = await fetch(`/api/commitments?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snooze: true }),
      });

      if (!response.ok) throw new Error('Failed to snooze');
      
      toast.success(`Snoozed for 1 hour (${currentSnoozeCount + 1}/2)`);
      onUpdate();
    } catch {
      toast.error('Failed to snooze commitment');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleModal || !rescheduleDate) {
      toast.error('Please select a new date');
      return;
    }

    setUpdatingId(rescheduleModal.id);
    try {
      const response = await fetch(`/api/commitments?id=${rescheduleModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rescheduled',
          rescheduledTo: rescheduleDate,
          rescheduledReason: rescheduleReason,
        }),
      });

      if (!response.ok) throw new Error('Failed to reschedule');
      
      toast.success('Commitment rescheduled');
      setRescheduleModal(null);
      setRescheduleDate('');
      setRescheduleReason('');
      onUpdate();
    } catch {
      toast.error('Failed to reschedule commitment');
    } finally {
      setUpdatingId(null);
    }
  };

  const generateRescheduleMessage = () => {
    if (!rescheduleModal) return '';
    return `Hey ${rescheduleModal.who}, I committed to "${rescheduleModal.what}" today but need to reschedule. Can I ${rescheduleDate}? Apologies for the shift.`;
  };

  const CommitmentItem = ({ commitment, isOverdue }: { commitment: Commitment; isOverdue: boolean }) => {
    const daysOverdue = isOverdue ? getDaysOverdue(new Date(commitment.when)) : 0;
    
    return (
      <div className={cn(
        "p-4 rounded-lg border-2 space-y-3",
        isOverdue ? "bg-red-50 border-red-500" : "bg-white border-gray-200"
      )}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-semibold text-lg">
              {commitment.who}
            </div>
            <div className="text-gray-700">
              {commitment.what}
            </div>
            <div className={cn(
              "text-sm mt-1",
              isOverdue ? "text-red-600 font-bold" : "text-gray-500"
            )}>
              {isOverdue 
                ? `${daysOverdue} days broken promise to ${commitment.who}`
                : formatCommitmentDate(new Date(commitment.when))
              }
            </div>
            {commitment.snoozeCount > 0 && (
              <div className="text-xs text-orange-500 mt-1">
                Snoozed {commitment.snoozeCount}/2 times
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleComplete(commitment.id)}
            disabled={updatingId === commitment.id}
            className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            <Check size={16} />
            Done
          </button>
          
          <button
            onClick={() => setRescheduleModal({ id: commitment.id, who: commitment.who, what: commitment.what })}
            disabled={updatingId === commitment.id}
            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            <Calendar size={16} />
            Reschedule
          </button>

          {(isOverdue || isToday(new Date(commitment.when))) && commitment.snoozeCount < 2 && (
            <button
              onClick={() => handleSnooze(commitment.id, commitment.snoozeCount)}
              disabled={updatingId === commitment.id}
              className="flex items-center gap-1 px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              <Clock size={16} />
              Snooze 1hr
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto">
        {overdue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={24} />
              <h2 className="text-2xl font-bold">Overdue ({overdue.length})</h2>
            </div>
            <div className="space-y-3">
              {overdue.map(commitment => (
                <CommitmentItem key={commitment.id} commitment={commitment} isOverdue={true} />
              ))}
            </div>
          </div>
        )}

        {today.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-yellow-600">Due Today ({today.length})</h2>
            <div className="space-y-3">
              {today.map(commitment => (
                <CommitmentItem key={commitment.id} commitment={commitment} isOverdue={false} />
              ))}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-600">Upcoming ({upcoming.length})</h2>
            <div className="space-y-3">
              {upcoming.map(commitment => (
                <CommitmentItem key={commitment.id} commitment={commitment} isOverdue={false} />
              ))}
            </div>
          </div>
        )}

        {commitments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No commitments yet. Add your first commitment above!
          </div>
        )}
      </div>

      {rescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full space-y-4">
            <h3 className="text-xl font-bold">Reschedule Commitment</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">New date/time:</label>
              <input
                type="text"
                placeholder="e.g., 'tomorrow 3pm', 'next Monday'"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Reason (optional):</label>
              <input
                type="text"
                placeholder="Brief explanation"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Message to send:</label>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                {generateRescheduleMessage()}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateRescheduleMessage());
                  toast.success('Message copied to clipboard');
                }}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Copy message
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReschedule}
                disabled={!rescheduleDate}
                className="flex-1 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                Confirm Reschedule
              </button>
              <button
                onClick={() => {
                  setRescheduleModal(null);
                  setRescheduleDate('');
                  setRescheduleReason('');
                }}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}