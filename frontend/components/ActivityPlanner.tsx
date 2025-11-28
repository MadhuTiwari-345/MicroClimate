import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, AlertCircle, Clock, Zap, TrendingUp } from 'lucide-react';

interface ActivityPlannerProps {
  lat: number;
  lon: number;
  loading?: boolean;
}

export const ActivityPlanner: React.FC<ActivityPlannerProps> = ({
  lat,
  lon,
  loading = false
}) => {
  const [planData, setPlanData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [selectedDay, setSelectedDay] = useState<number>(0);

  useEffect(() => {
    const fetchActivityPlan = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/weather/activity_plan?lat=${lat}&lon=${lon}&days=7`
        );
        const data = await response.json();
        setPlanData(data);
      } catch (error) {
        console.error('Error fetching activity plan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityPlan();
  }, [lat, lon]);

  if (isLoading) {
    return (
      <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4">
        <h3 className="text-xs font-semibold text-gray-200 mb-3">Activity Planner</h3>
        <div className="h-40 bg-white/5 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!planData?.weekly_plan || planData.weekly_plan.length === 0) return null;

  const selectedPlan = planData.weekly_plan[selectedDay];
  const summary = planData.summary || {};

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'SAFE': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'MODERATE': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'RISKY': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getActivityEmoji = (activity: string) => {
    const emojis: { [key: string]: string } = {
      'running': '🏃',
      'cycling': '🚴',
      'hiking': '🥾',
      'swimming': '🏊',
      'yoga': '🧘',
      'gym': '💪',
      'outdoor_party': '🎉',
      'picnic': '🧺',
      'tennis': '🎾',
      'REST DAY': '😴'
    };
    return emojis[activity] || '⚽';
  };

  return (
    <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-200">📅 Weekly Activity Plan</h3>
        <Calendar className="w-4 h-4 text-[#00C2FF]" />
      </div>

      {/* Weekly Summary */}
      <div className="bg-[#161B26] rounded-lg p-3 border border-white/5">
        <div className="grid grid-cols-3 gap-2 text-[9px]">
          <div className="text-center">
            <div className="text-gray-400 mb-1">Total Hours</div>
            <div className="text-lg font-bold text-[#00C2FF]">
              {summary.total_planned_hours?.toFixed(1) || '0'} h
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 mb-1">Safe Days</div>
            <div className="text-lg font-bold text-green-400">
              {summary.safe_weather_days || '0'}/7
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 mb-1">Best Day</div>
            <div className="text-lg font-bold text-yellow-400">
              {summary.best_day?.slice(0, 3) || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex space-x-1 overflow-x-auto pb-2">
        {planData.weekly_plan.map((plan: any, idx: number) => (
          <button
            key={idx}
            onClick={() => setSelectedDay(idx)}
            className={`px-3 py-2 rounded-lg text-[9px] font-semibold whitespace-nowrap transition-all ${
              selectedDay === idx
                ? 'bg-[#00C2FF] text-black'
                : `bg-[#161B26] text-gray-400 hover:text-white border border-white/5 ${
                    plan.safety_level === 'SAFE' ? 'hover:border-green-500/50' : ''
                  }`
            }`}
          >
            <div>{plan.day.slice(0, 3)}</div>
            <div className="text-[7px] text-gray-500">
              {getActivityEmoji(plan.recommended_activity || 'N/A')}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Day Details */}
      {selectedPlan && (
        <div className="space-y-3">
          {/* Activity Card */}
          <div className={`rounded-lg p-3 border ${getSafetyColor(selectedPlan.safety_level)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{getActivityEmoji(selectedPlan.recommended_activity)}</span>
                <div>
                  <div className="text-[10px] font-bold capitalize">
                    {selectedPlan.recommended_activity}
                  </div>
                  <div className="text-[8px] opacity-80">
                    {selectedPlan.day}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold">{selectedPlan.activity_score}%</div>
                <div className="text-[7px] opacity-75">{selectedPlan.safety_level}</div>
              </div>
            </div>
            <div className="text-[8px] mb-2 opacity-90">{selectedPlan.reason}</div>
            <div className="w-full bg-black/20 rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-current opacity-50"
                style={{ width: `${selectedPlan.activity_score}%` }}
              />
            </div>
          </div>

          {/* Activity Details */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#161B26] rounded-lg p-2 border border-white/5">
              <div className="text-[8px] text-gray-400 mb-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" /> Duration
              </div>
              <div className="text-[10px] font-bold text-[#00C2FF]">
                {selectedPlan.duration_minutes} minutes
              </div>
            </div>
            <div className="bg-[#161B26] rounded-lg p-2 border border-white/5">
              <div className="text-[8px] text-gray-400 mb-1 flex items-center">
                <Zap className="w-3 h-3 mr-1" /> Best Time
              </div>
              <div className="text-[10px] font-bold text-yellow-400">
                {selectedPlan.best_time}
              </div>
            </div>
          </div>

          {/* Weather Summary */}
          <div className="bg-[#161B26] rounded-lg p-2 border border-white/5 text-[8px]">
            <div className="text-gray-400 font-semibold mb-1">Weather Conditions</div>
            <div className="grid grid-cols-2 gap-1 text-gray-300">
              <div>🌡️ {selectedPlan.weather_summary?.temp}°C</div>
              <div>☁️ {selectedPlan.weather_summary?.condition}</div>
              <div>💧 {selectedPlan.weather_summary?.humidity}%</div>
              <div>😷 AQI {selectedPlan.weather_summary?.aqi}</div>
            </div>
          </div>

          {/* Preparations */}
          {selectedPlan.preparations && selectedPlan.preparations.length > 0 && (
            <div className="bg-[#161B26] rounded-lg p-2 border border-white/5">
              <div className="text-[8px] text-gray-400 font-semibold mb-1.5">✅ Preparations</div>
              <div className="space-y-0.5">
                {selectedPlan.preparations.map((prep: string, idx: number) => (
                  <div key={idx} className="text-[8px] text-gray-300 flex items-start">
                    <span className="mr-1.5">•</span>
                    <span>{prep}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Score Breakdown */}
          <div className="bg-[#161B26] rounded-lg p-2 border border-white/5 text-[8px]">
            <div className="text-gray-400 font-semibold mb-1.5">📊 Score Breakdown</div>
            <div className="space-y-1 text-gray-300">
              <div className="flex justify-between">
                <span>Temperature Fit:</span>
                <span className="text-[#00C2FF]">
                  {selectedPlan.activity_score > 70 ? '✓ Excellent' : 'Moderate'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Air Quality:</span>
                <span className={selectedPlan.weather_summary?.aqi > 100 ? 'text-yellow-400' : 'text-green-400'}>
                  {selectedPlan.weather_summary?.aqi > 150 ? '⚠️ Poor' : 'Good'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Overall Conditions:</span>
                <span className={selectedPlan.safety_level === 'SAFE' ? 'text-green-400' : 'text-yellow-400'}>
                  {selectedPlan.safety_level}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Week Overview */}
      <div className="bg-[#161B26] rounded-lg p-2 border border-white/5">
        <div className="text-[8px] text-gray-400 font-semibold mb-1.5">📋 This Week's Summary</div>
        <div className="text-[8px] text-gray-300">
          {summary.recommendation || 'Plan your activities based on weather'}
        </div>
      </div>
    </div>
  );
};
