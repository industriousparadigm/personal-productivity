'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TrustData {
  daysSinceChased: number | null;
  weekStats: {
    total: number;
    kept: number;
    rescheduled: number;
    broken: number;
  };
  brokenByPerson: Array<{
    who: string;
    count: number;
  }>;
}

export function TrustScore() {
  const [trustData, setTrustData] = useState<TrustData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrustData();
  }, []);

  const fetchTrustData = async () => {
    try {
      const response = await fetch('/api/trust');
      if (response.ok) {
        const data = await response.json();
        setTrustData(data);
      }
    } catch (error) {
      console.error('Failed to fetch trust data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!trustData) {
    return null;
  }

  const keepRate = trustData.weekStats.total > 0
    ? Math.round((trustData.weekStats.kept / trustData.weekStats.total) * 100)
    : 0;

  const isGoodScore = keepRate >= 80;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
      <div className="text-center">
        <div className="text-6xl font-bold mb-2">
          {trustData.daysSinceChased !== null ? (
            <span className={cn(
              trustData.daysSinceChased > 7 ? "text-green-600" : "text-red-600"
            )}>
              {trustData.daysSinceChased}
            </span>
          ) : (
            <span className="text-green-600">∞</span>
          )}
        </div>
        <div className="text-lg text-gray-600">
          days since someone had to chase you
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold mb-1">
            {trustData.weekStats.total}
          </div>
          <div className="text-sm text-gray-600">
            Promises this week
          </div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className={cn(
            "text-2xl font-bold mb-1 flex items-center justify-center gap-2",
            isGoodScore ? "text-green-600" : "text-red-600"
          )}>
            {keepRate}%
            {isGoodScore ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div className="text-sm text-gray-600">
            Keep rate
          </div>
        </div>
      </div>

      {trustData.weekStats.broken > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle size={20} />
            <span className="font-semibold">Broken Promises This Week</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {trustData.weekStats.broken}
          </div>
        </div>
      )}

      {trustData.brokenByPerson.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-600">
            People you disappoint most:
          </div>
          <div className="space-y-1">
            {trustData.brokenByPerson.map((person, i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <span className="text-sm">{person.who}</span>
                <span className="text-sm font-bold text-red-600">
                  {person.count} broken
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}