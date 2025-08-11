'use client';

import { format } from 'date-fns';
import { CheckCircle, XCircle, Calendar, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Commitment {
  id: string;
  who: string;
  what: string;
  when: string;
  status: string;
  completedAt?: string;
  rescheduledAt?: string;
  createdAt: string;
}

interface CommitmentHistoryProps {
  commitments: Commitment[];
  onRefresh?: () => void;
}

export function CommitmentHistory({ commitments, onRefresh }: CommitmentHistoryProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const sortedCommitments = [...commitments].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleDelete = async (commitmentId: string) => {
    if (!confirm('Delete this experimental commitment? This cannot be undone.')) {
      return;
    }

    setDeleting(commitmentId);
    try {
      const response = await fetch(`/api/commitments?id=${commitmentId}`, {
        method: 'DELETE',
      });

      // Parse the response to check for success
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Delete failed with status:', response.status);
        console.error('Response data:', data);
        throw new Error(data.error || 'Failed to delete commitment');
      }

      // Check if the response indicates success
      if (data.success) {
        toast.success('Commitment deleted');
        
        // Refresh the list
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        throw new Error(data.error || 'Unexpected response from server');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete commitment');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'rescheduled':
        return <Calendar className="text-blue-500" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      default:
        return <XCircle className="text-red-500" size={20} />;
    }
  };

  const getStatusText = (commitment: Commitment) => {
    const when = new Date(commitment.when);
    const now = new Date();
    
    switch (commitment.status) {
      case 'completed':
        return commitment.completedAt 
          ? `Completed on ${format(new Date(commitment.completedAt), 'MMM d, yyyy')}`
          : 'Completed';
      case 'rescheduled':
        return commitment.rescheduledAt
          ? `Rescheduled on ${format(new Date(commitment.rescheduledAt), 'MMM d, yyyy')}`
          : 'Rescheduled';
      case 'pending':
        if (when < now) {
          const daysOverdue = Math.floor((now.getTime() - when.getTime()) / (1000 * 60 * 60 * 24));
          return `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`;
        }
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const weeklyStats = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekCommitments = commitments.filter(c => 
      new Date(c.createdAt) >= weekAgo
    );

    const completed = weekCommitments.filter(c => c.status === 'completed').length;
    const rescheduled = weekCommitments.filter(c => c.status === 'rescheduled').length;
    const pending = weekCommitments.filter(c => c.status === 'pending').length;
    
    return { total: weekCommitments.length, completed, rescheduled, pending };
  };

  const stats = weeklyStats();

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">This Week&apos;s Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.rescheduled}</div>
            <div className="text-sm text-gray-600">Rescheduled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">Commitment History</h3>
        <div className="space-y-3">
          {sortedCommitments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No commitment history yet
            </div>
          ) : (
            sortedCommitments.map(commitment => (
              <div
                key={commitment.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border group relative",
                  commitment.status === 'completed' && "bg-green-50 border-green-200",
                  commitment.status === 'rescheduled' && "bg-blue-50 border-blue-200",
                  commitment.status === 'pending' && new Date(commitment.when) < new Date() && "bg-red-50 border-red-200",
                  commitment.status === 'pending' && new Date(commitment.when) >= new Date() && "bg-gray-50 border-gray-200"
                )}
              >
                <div className="mt-0.5">
                  {getStatusIcon(commitment.status)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{commitment.who}</div>
                  <div className="text-gray-700">{commitment.what}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Due: {format(new Date(commitment.when), 'MMM d, yyyy h:mm a')}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {getStatusText(commitment)}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(commitment.id)}
                  disabled={deleting === commitment.id}
                  className={cn(
                    "absolute top-3 right-3 p-1.5 rounded-md transition-all",
                    "opacity-0 group-hover:opacity-100",
                    "hover:bg-red-100 hover:text-red-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    deleting === commitment.id && "opacity-100"
                  )}
                  title="Delete experimental commitment"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}