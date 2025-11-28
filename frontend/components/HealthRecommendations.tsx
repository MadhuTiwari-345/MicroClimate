import React, { useState, useEffect } from 'react';
import { Heart, Activity, AlertCircle, CheckCircle, TrendingUp, Wind, Droplets, Eye } from 'lucide-react';

interface HealthInsight {
  health_risk_index: number;
  risk_factors: string[];
  warning_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  safe_for_profile: boolean;
}

interface Activity {
  activity: string;
  compatibility_score: number;
  safety_level: string;
  warnings: string[];
  estimated_duration: string;
}

interface HealthRecommendationsProps {
  lat: number;
  lon: number;
  tempUnit: string;
  loading?: boolean;
}

export const HealthRecommendations: React.FC<HealthRecommendationsProps> = ({
  lat,
  lon,
  tempUnit,
  loading = false
}) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState('general_fitness');
  const [isLoading, setIsLoading] = useState(loading);

  useEffect(() => {
    const fetchHealthData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/weather/health_recommendations?lat=${lat}&lon=${lon}&health_profile=${selectedProfile}`
        );
        const data = await response.json();
        setHealthData(data);
      } catch (error) {
        console.error('Error fetching health recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
  }, [lat, lon, selectedProfile]);

  if (isLoading) {
    return (
      <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4">
        <h3 className="text-xs font-semibold text-gray-200 mb-3">Health Recommendations</h3>
        <div className="h-40 bg-white/5 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!healthData) return null;

  const healthIndex = healthData.health_index || {};
  const activities = healthData.recommended_activities || [];
  const tips = healthData.health_tips || [];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500';
      case 'HIGH': return 'text-orange-500';
      case 'MODERATE': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-200">Health Impact Zone</h3>
        <select
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
          className="text-[9px] bg-[#161B26] border border-white/10 rounded px-2 py-1 text-gray-300 hover:text-white transition-colors"
        >
          <option value="general_fitness">General</option>
          <option value="asthma">Asthma</option>
          <option value="cardiac">Cardiac</option>
          <option value="arthritis">Arthritis</option>
        </select>
      </div>

      {/* Health Risk Index */}
      <div className="bg-[#161B26] rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-gray-400">Health Risk Index</span>
          <span className={`text-sm font-bold ${getRiskColor(healthIndex.warning_level || 'LOW')}`}>
            {healthIndex.health_risk_index || 0}/100
          </span>
        </div>
        <div className="w-full bg-[#0B0E14] rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all ${
              healthIndex.health_risk_index > 80
                ? 'bg-red-500'
                : healthIndex.health_risk_index > 60
                ? 'bg-orange-500'
                : healthIndex.health_risk_index > 40
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${healthIndex.health_risk_index || 0}%` }}
          />
        </div>
        <div className="flex items-center mt-2 text-[10px] text-gray-400">
          {healthIndex.warning_level === 'CRITICAL' && (
            <AlertCircle className="w-3 h-3 mr-1 text-red-500" />
          )}
          {healthIndex.warning_level === 'HIGH' && (
            <AlertCircle className="w-3 h-3 mr-1 text-orange-500" />
          )}
          {healthIndex.warning_level === 'LOW' && (
            <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
          )}
          <span>
            {healthIndex.safe_for_profile ? '✓ Safe conditions' : '⚠️ Caution advised'}
          </span>
        </div>
      </div>

      {/* Risk Factors */}
      {healthIndex.risk_factors && healthIndex.risk_factors.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] font-semibold text-gray-400">Risk Factors:</p>
          {healthIndex.risk_factors.map((factor, idx) => (
            <div key={idx} className="text-[9px] text-gray-400 flex items-start">
              <span className="text-red-500 mr-1.5">•</span>
              <span>{factor}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Activities */}
      <div className="space-y-2">
        <p className="text-[9px] font-semibold text-gray-400">🎯 Safe Activities:</p>
        {activities.slice(0, 3).map((activity, idx) => (
          <div key={idx} className="bg-[#161B26] rounded p-2 border border-white/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#00C2FF]">{activity.activity}</span>
              <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                {activity.compatibility_score}%
              </span>
            </div>
            <div className="text-[8px] text-gray-400">
              Duration: {activity.estimated_duration}
            </div>
            {activity.warnings.length > 0 && (
              <div className="text-[8px] text-yellow-500 mt-1">
                ⚠️ {activity.warnings[0]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Health Tips */}
      <div className="space-y-1">
        <p className="text-[9px] font-semibold text-gray-400">💡 Health Tips:</p>
        {tips.slice(0, 3).map((tip, idx) => (
          <div key={idx} className="text-[8px] text-gray-400 flex items-start">
            <span className="mr-1.5">{tip.split(' ')[0]}</span>
            <span>{tip.substring(tip.indexOf(' ') + 1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
