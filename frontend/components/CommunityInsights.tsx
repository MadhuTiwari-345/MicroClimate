import React, { useState, useEffect } from 'react';
import { Globe, TrendingUp, AlertTriangle, Users, Trophy, Zap } from 'lucide-react';

interface CommunityInsightsProps {
  lat: number;
  lon: number;
  loading?: boolean;
}

export const CommunityInsights: React.FC<CommunityInsightsProps> = ({
  lat,
  lon,
  loading = false
}) => {
  const [insightsData, setInsightsData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'global' | 'alerts' | 'community' | 'trends'>('global');
  const [isLoading, setIsLoading] = useState(loading);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/weather/community_insights?lat=${lat}&lon=${lon}`
        );
        const data = await response.json();
        setInsightsData(data);
      } catch (error) {
        console.error('Error fetching community insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [lat, lon]);

  if (isLoading) {
    return (
      <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4">
        <h3 className="text-xs font-semibold text-gray-200 mb-3">Community Insights</h3>
        <div className="h-40 bg-white/5 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!insightsData) return null;

  return (
    <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-200">🌍 Community Insights</h3>
        <Globe className="w-4 h-4 text-[#00C2FF]" />
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-white/5">
        {(['global', 'alerts', 'community', 'trends'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[9px] font-semibold pb-2 px-2 transition-colors ${
              activeTab === tab
                ? 'text-[#00C2FF] border-b-2 border-[#00C2FF]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'global' && '🌐 Global'}
            {tab === 'alerts' && '⚠️ Alerts'}
            {tab === 'community' && '👥 Community'}
            {tab === 'trends' && '📈 Trends'}
          </button>
        ))}
      </div>

      {/* Global Comparisons */}
      {activeTab === 'global' && insightsData.global_comparisons && (
        <div className="space-y-2">
          {insightsData.global_comparisons.slice(0, 4).map((comparison: any, idx: number) => (
            <div key={idx} className="bg-[#161B26] rounded-lg p-2 border border-white/5 hover:border-[#00C2FF]/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-white">{comparison.location}</span>
                <span className="text-[8px] bg-[#00C2FF]/20 text-[#00C2FF] px-1.5 py-0.5 rounded">
                  {comparison.similarity_score.toFixed(0)}% match
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[8px]">
                <div>🌡️ {comparison.temperature.toFixed(1)}°</div>
                <div>💧 {comparison.humidity.toFixed(0)}%</div>
                <div>😷 AQI {comparison.aqi.toFixed(0)}</div>
              </div>
              <div className="text-[8px] text-gray-400 mt-1 italic">{comparison.interesting_fact}</div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {activeTab === 'alerts' && insightsData.community_alerts && (
        <div className="space-y-2">
          {insightsData.community_alerts.map((alert: any, idx: number) => (
            <div
              key={idx}
              className={`rounded-lg p-2 border-l-4 ${
                alert.priority === 'CRITICAL'
                  ? 'bg-red-500/10 border-l-red-500'
                  : alert.priority === 'HIGH'
                  ? 'bg-orange-500/10 border-l-orange-500'
                  : 'bg-yellow-500/10 border-l-yellow-500'
              }`}
            >
              <div className="text-[9px] font-bold text-white mb-1">{alert.type}</div>
              <div className="text-[8px] text-gray-300 mb-1">{alert.message}</div>
              <div className="text-[7px] text-gray-400 space-y-0.5">
                {alert.actions.slice(0, 2).map((action: string, i: number) => (
                  <div key={i}>✓ {action}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Community */}
      {activeTab === 'community' && insightsData.peer_insights && (
        <div className="space-y-2">
          <div className="bg-[#161B26] rounded-lg p-2 border border-white/5">
            <div className="text-[9px] font-semibold text-gray-300 mb-1">
              👥 {insightsData.peer_insights.users_in_your_location} users in your area
            </div>
            <div className="text-[8px] text-gray-400">
              Community sentiment: {insightsData.peer_insights.community_sentiment}
            </div>
          </div>
          {insightsData.peer_insights.recent_reports?.slice(0, 3).map((report: any, idx: number) => (
            <div key={idx} className="bg-[#161B26] rounded-lg p-2 border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-white">{report.user}</span>
                <span className="text-[7px] text-gray-400">{report.time_ago}</span>
              </div>
              <div className="text-[8px] text-gray-300">{report.report}</div>
              <div className="text-[7px] text-gray-500 mt-1">❤️ {report.likes} people found this helpful</div>
            </div>
          ))}
        </div>
      )}

      {/* Trending Events */}
      {activeTab === 'trends' && insightsData.trending_events && (
        <div className="space-y-2">
          {insightsData.trending_events.slice(0, 3).map((event: any, idx: number) => (
            <div
              key={idx}
              className={`rounded-lg p-2 border-l-4 bg-[#161B26] ${
                event.severity === 'CRITICAL'
                  ? 'border-l-red-500'
                  : event.severity === 'HIGH'
                  ? 'border-l-orange-500'
                  : 'border-l-yellow-500'
              }`}
            >
              <div className="text-[9px] font-bold mb-1">
                {event.emoji} {event.event}
              </div>
              <div className="text-[8px] text-gray-400 mb-1">
                📍 {event.location} | {event.affected_people} affected
              </div>
              <div className="text-[8px] text-gray-300 space-y-0.5">
                {event.insights.slice(0, 2).map((insight: string, i: number) => (
                  <div key={i}>• {insight}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {insightsData.climate_stats && (
        <div className="bg-[#161B26] rounded-lg p-2 border border-white/5">
          <div className="text-[9px] font-semibold text-gray-300 mb-2">🏆 Your Climate Achievements</div>
          <div className="grid grid-cols-2 gap-1 text-[8px]">
            <div>🌞 {insightsData.climate_stats.days_without_extreme_weather} days stable</div>
            <div>💨 {insightsData.climate_stats.consecutive_good_air_quality_days} clean days</div>
          </div>
        </div>
      )}
    </div>
  );
};
