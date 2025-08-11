'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

interface CommitmentFormProps {
  onCommitmentAdded?: () => void;
  disabled?: boolean;
  disabledMessage?: string;
}

export function CommitmentForm({ onCommitmentAdded, disabled, disabledMessage }: CommitmentFormProps) {
  const [who, setWho] = useState('');
  const [what, setWhat] = useState('');
  const [when, setWhen] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) {
      toast.error(disabledMessage || 'Cannot add new commitments');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ who, what, when }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add commitment');
      }

      toast.success('Commitment added');
      setWho('');
      setWhat('');
      setWhen('');
      onCommitmentAdded?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add commitment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className={cn(
        "bg-white rounded-lg shadow-lg p-6 space-y-4",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        {disabled && disabledMessage && (
          <div className="bg-red-500 text-white p-3 rounded-md font-semibold text-center">
            {disabledMessage}
          </div>
        )}
        
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Who? (e.g., 'Carolina', 'PM team', 'Dev')"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
            required
          />
        </div>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="What? (e.g., 'Review PR', 'Send report', 'Deploy feature')"
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
            required
          />
        </div>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="When? (e.g., 'today', 'tomorrow 3pm', 'Friday', 'next week')"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
            required
          />
        </div>

        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className={cn(
            "w-full py-4 text-lg font-semibold rounded-md transition-colors",
            "bg-blue-500 text-white hover:bg-blue-600",
            "disabled:bg-gray-300 disabled:cursor-not-allowed"
          )}
        >
          {isSubmitting ? 'Adding...' : 'Add Commitment'}
        </button>
      </div>
    </form>
  );
}