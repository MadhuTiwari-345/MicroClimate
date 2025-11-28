import React, { useState, useEffect } from 'react';
import { Leaf, TrendingDown, Award, AlertCircle, Zap } from 'lucide-react';

interface CarbonTrackerProps {
  lat: number;
  lon: number;
  loading?: boolean;
}

export const CarbonFootprintTracker: React.FC<CarbonTrackerProps> = ({
  lat,
  lon,
  loading = false
}) => {
  const [carbonData, setCarbonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [activeTab, setActiveTab] = useState<'daily' | 'score' | 'eco' | 'offset'>('daily');

  useEffect(() => {
    const fetchCarbonData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/weather/carbon_footprint?lat=${lat}&lon=${lon}`
        );
        const data = await response.json();
        setCarbonData(data);
      } catch (error) {
        console.error('Error fetching carbon data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarbonData();
  }, [lat, lon]);

  if (isLoading) {
    return (
      <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4">
        <h3 className="text-xs font-semibold text-gray-200 mb-3">Carbon Footprint</h3>
        <div className="h-40 bg-white/5 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!carbonData) return null;

  const dailyFootprint = carbonData.daily_footprint || {};
  const carbonScore = carbonData.carbon_score || {};
  const ecoRecs = carbonData.eco_recommendations || [];
  const offsets = carbonData.carbon_offsets || [];

  return (
    <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-200">♻️ Carbon Footprint</h3>
        <Leaf className="w-4 h-4 text-green-500" />
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-white/5 overflow-x-auto">
        {(['daily', 'score', 'eco', 'offset'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[9px] font-semibold pb-2 px-2 whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'text-green-500 border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'daily' && '📊 Daily'}
            {tab === 'score' && '🎯 Score'}
            {tab === 'eco' && '🌱 Eco Tips'}
            {tab === 'offset' && '♻️ Offset'}
          </button>
        ))}
      </div>

      {/* Daily Emissions */}
      {activeTab === 'daily' && (
        <div className="space-y-3">
          <div className="bg-[#161B26] rounded-lg p-3 border border-white/5">
            <div className="text-[10px] text-gray-400 mb-2">Today's Emissions</div>
            <div className="text-2xl font-bold text-green-400">
              {dailyFootprint.total_daily_emissions_kg_co2?.toFixed(2) || '0'} kg CO₂e
            </div>
            <div className="text-[8px] text-gray-400 mt-1">
              Status: <span className={
                dailyFootprint.status === 'UNDER' ? 'text-green-400' : 
                dailyFootprint.status === 'AT' ? 'text-yellow-400' : 
                'text-red-400'
              }>{dailyFootprint.status} TARGET</span>
            </div>
            <div className="w-full bg-[#0B0E14] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full ${
                  dailyFootprint.percentage_of_target < 100 ? 'bg-green-500' :
                  dailyFootprint.percentage_of_target < 125 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, dailyFootprint.percentage_of_target)}%` }}
              />
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="space-y-2">
            <p className="text-[9px] font-semibold text-gray-400">Activity Breakdown:</p>
            {dailyFootprint.activity_breakdown?.slice(0, 4).map((activity: any, idx: number) => (
              <div key={idx} className="bg-[#161B26] rounded p-2 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-white capitalize">{activity.activity}</span>
                  <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${
                    activity.carbon_intensity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                    activity.carbon_intensity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {activity.carbon_intensity}
                  </span>
                </div>
                <div className="text-[8px] text-gray-400">
                  {activity.emissions_kg_co2?.toFixed(2) || '0'} kg CO₂ • {activity.duration_minutes} min
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carbon Score */}
      {activeTab === 'score' && (
        <div className="space-y-3">
          <div className="bg-[#161B26] rounded-lg p-4 border border-white/5 text-center">
            <div className="text-3xl font-bold mb-1">
              <span className="text-green-400">{carbonScore.carbon_score || 0}</span>
              <span className="text-gray-400 text-lg">/100</span>
            </div>
            <div className="text-sm font-semibold mb-3">{carbonScore.rating || 'UNKNOWN'}</div>
            <div className="w-full bg-[#0B0E14] rounded-full h-2 overflow-hidden mb-3">
              <div
                className={`h-full ${
                  carbonScore.carbon_score > 80 ? 'bg-green-500' :
                  carbonScore.carbon_score > 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${carbonScore.carbon_score || 0}%` }}
              />
            </div>
          </div>

          <div className="bg-[#161B26] rounded-lg p-3 border border-white/5 space-y-2">
            <p className="text-[9px] font-semibold text-gray-400">🏆 Achievements:</p>
            {carbonScore.achievements?.map((achievement: string, idx: number) => (
              <div key={idx} className="text-[8px] text-gray-300 flex items-center">
                <Award className="w-3 h-3 mr-2 text-yellow-500" />
                {achievement}
              </div>
            ))}
          </div>

          <div className="bg-[#161B26] rounded-lg p-3 border border-white/5 text-[8px]">
            <div className="text-gray-400 mb-2">Environmental Impact:</div>
            {carbonScore.weekly_emissions && (
              <div className="space-y-1 text-gray-300">
                <div>🌳 {(carbonScore.weekly_emissions / 21).toFixed(1)} trees to offset 1 week</div>
                <div>🚗 Equivalent to {(carbonScore.weekly_emissions / 0.21).toFixed(0)} km driven</div>
                <div>✈️ {(carbonScore.weekly_emissions / 200).toFixed(2)} transatlantic flights</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Eco Recommendations */}
      {activeTab === 'eco' && (
        <div className="space-y-2">
          {ecoRecs.slice(0, 5).map((rec: any, idx: number) => (
            <div key={idx} className="bg-[#161B26] rounded-lg p-2 border border-white/5 hover:border-green-500/30 transition-colors">
              <div className="flex items-start justify-between mb-1">
                <div className="text-[10px] font-bold text-white flex-1">
                  {rec.emoji} {rec.suggestion}
                </div>
                <span className="text-[7px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                  -{rec.carbon_savings || 0} kg CO₂
                </span>
              </div>
              <div className="text-[8px] text-gray-400">
                <span className={`
                  ${rec.difficulty === 'EASY' ? 'text-green-400' :
                    rec.difficulty === 'MEDIUM' ? 'text-yellow-400' :
                    'text-red-400'}
                `}>
                  {rec.difficulty}
                </span>
                {' •'} {rec.time_to_implement}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offset Options */}
      {activeTab === 'offset' && (
        <div className="space-y-2">
          <p className="text-[8px] text-gray-400 mb-2">🌍 Offset your carbon footprint:</p>
          {offsets.slice(0, 4).map((offset: any, idx: number) => (
            <div key={idx} className="bg-[#161B26] rounded-lg p-2 border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-white">{offset.option}</span>
                <span className="text-[9px] font-bold text-green-400">${offset.cost_usd}</span>
              </div>
              <div className="text-[8px] text-gray-400 mb-1">
                Offsets {offset.offsets_kg_co2} kg CO₂e
              </div>
              <div className="text-[7px] text-gray-500">💚 {offset.environmental_benefit}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
