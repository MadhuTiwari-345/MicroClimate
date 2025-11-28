import React, { useState } from 'react';
import { Radar, TrendingUp, AlertCircle } from 'lucide-react';

interface PredictionData {
  time: string;
  temp: number;
  humidity: number;
  pressure: number;
  wind: number;
  predicted_risk: number;
  status: string;
}

interface PredictionGraphProps {
  predictions: PredictionData[] | { predictions: PredictionData[] } | null;
  loading?: boolean;
  formatTemp: (c: number) => number;
  tempUnit: string;
}

export const PredictionGraph: React.FC<PredictionGraphProps> = ({ 
  predictions, 
  loading = false, 
  formatTemp,
  tempUnit 
}) => {
  const [activeMetric, setActiveMetric] = useState<'temp' | 'risk'>('temp');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: PredictionData } | null>(null);

  // Normalize predictions to always be an array
  let predictionsArray: PredictionData[] = [];
  if (predictions) {
    if (Array.isArray(predictions)) {
      predictionsArray = predictions;
    } else if (predictions && typeof predictions === 'object' && 'predictions' in predictions && Array.isArray((predictions as any).predictions)) {
      predictionsArray = (predictions as any).predictions;
    }
  }

  if (loading) {
    return (
      <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4">
        <h3 className="text-xs font-semibold text-gray-200 mb-3">Prediction Forecast Graph</h3>
        <div className="h-40 bg-white/5 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!predictionsArray || predictionsArray.length === 0) {
    return (
      <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-200">Prediction Forecast Graph</h3>
          <Radar className="w-3 h-3 text-[#00C2FF]" />
        </div>
        <div className="h-24 flex items-center justify-center text-[10px] text-gray-500">
          No prediction data available
        </div>
      </div>
    );
  }

  // Extract data for chart
  const temps = predictionsArray.map(p => p.temp);
  const risks = predictionsArray.map(p => p.predicted_risk);
  
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const minRisk = 0;
  const maxRisk = 100;
  
  const tempRange = maxTemp - minTemp || 1;
  const riskRange = maxRisk - minRisk || 1;
  
  const tempPadding = tempRange * 0.1;
  const riskPadding = riskRange * 0.1;

  // Calculate points for SVG (0-100 coordinate system)
  const tempPoints = predictionsArray.map((p, i) => {
    const x = (i / (predictionsArray.length - 1 || 1)) * 100;
    const y = 100 - (((p.temp - (minTemp - tempPadding)) / (tempRange + tempPadding * 2)) * 100);
    return { x, y, data: p, index: i };
  });

  const riskPoints = predictionsArray.map((p, i) => {
    const x = (i / (predictionsArray.length - 1 || 1)) * 100;
    const y = 100 - (((p.predicted_risk - (minRisk - riskPadding)) / (riskRange + riskPadding * 2)) * 100);
    return { x, y, data: p, index: i };
  });

  const activePoints = activeMetric === 'temp' ? tempPoints : riskPoints;
  
  // Build line path
  const lineD = activePoints.length > 1 
    ? `M ${activePoints.map(p => `${p.x},${p.y}`).join(' ')}`
    : `M 0,50 L 100,50`;

  const pathD = `${lineD} L 100,100 L 0,100 Z`;
  const lineColor = activeMetric === 'temp' ? '#00C2FF' : '#ef4444';
  const gradId = activeMetric === 'temp' ? 'gradPredTemp' : 'gradPredRisk';
  const stopColor = activeMetric === 'temp' ? '#00C2FF' : '#ef4444';

  return (
    <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-200">Prediction Forecast Graph</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveMetric('temp')}
            className={`px-2 py-1 text-[9px] font-medium rounded transition-all ${
              activeMetric === 'temp' 
                ? 'bg-[#00C2FF] text-black' 
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Temp
          </button>
          <button
            onClick={() => setActiveMetric('risk')}
            className={`px-2 py-1 text-[9px] font-medium rounded transition-all ${
              activeMetric === 'risk' 
                ? 'bg-red-500 text-white' 
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Risk
          </button>
        </div>
      </div>

      <div className="w-full bg-[#161B26] rounded-lg relative overflow-hidden flex flex-col h-28" onMouseLeave={() => setHoveredPoint(null)}>
        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={stopColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={stopColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={pathD} fill={`url(#${gradId})`} className="animate-fade-in" />
          <path d={lineD} fill="none" stroke={lineColor} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          {/* Pulse dot at end */}
          {activePoints.length > 0 && (
            <circle cx={activePoints[activePoints.length - 1].x} cy={activePoints[activePoints.length - 1].y} r="3" fill="white" className="animate-pulse" />
          )}
        </svg>

        {/* Value labels */}
        <span className="absolute right-1 top-0 text-[8px] text-gray-600 font-mono">
          {activeMetric === 'temp' ? `${formatTemp(maxTemp)}°${tempUnit}` : `${maxRisk}`}
        </span>
        <span className="absolute right-1 bottom-0 text-[8px] text-gray-600 font-mono">
          {activeMetric === 'temp' ? `${formatTemp(minTemp)}°${tempUnit}` : `${minRisk}`}
        </span>

        {/* Interactive hover points */}
        <div className="absolute inset-0 w-full h-full flex items-stretch">
          {activePoints.map((p) => (
            <div 
              key={p.index}
              className="flex-1 hover:bg-white/5 relative group/point cursor-pointer"
              onMouseEnter={() => setHoveredPoint({x: p.x, y: p.y, data: p.data})}
            >
              <div 
                className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover/point:opacity-100 shadow-lg pointer-events-none transition-opacity"
                style={{ 
                  top: `${p.y}%`, 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `0 0 8px ${lineColor}`
                }}
              />
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredPoint && (
          <div 
            className="absolute bg-[#0B0E14]/95 backdrop-blur-md border border-white/20 rounded-lg p-2 pointer-events-none z-50 shadow-2xl min-w-[120px] animate-scale-in text-[9px]"
            style={{ 
              left: `${hoveredPoint.x}%`, 
              top: `${hoveredPoint.y}%`, 
              transform: `translate(${hoveredPoint.x < 20 ? '10px' : hoveredPoint.x > 80 ? '-110%' : '-50%'}, -120%)`
            }}
          >
            <div className="text-gray-400 font-medium mb-1 pb-1 border-b border-white/10">
              {new Date(hoveredPoint.data.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Temp:</span>
                <span className="text-[#00C2FF] font-bold">{formatTemp(hoveredPoint.data.temp)}°{tempUnit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Risk:</span>
                <span className={`font-bold ${
                  hoveredPoint.data.predicted_risk < 30 ? 'text-green-400' :
                  hoveredPoint.data.predicted_risk < 60 ? 'text-yellow-400' :
                  'text-red-500'
                }`}>
                  {hoveredPoint.data.predicted_risk}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="font-bold text-blue-400">{hoveredPoint.data.status}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prediction cards summary */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {predictionsArray.map((p, i) => (
          <div key={i} className="bg-[#161B26] rounded p-2 text-center hover:bg-white/5 transition-colors cursor-pointer">
            <div className="text-[8px] text-gray-500 mb-0.5">
              {new Date(p.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </div>
            <div className="text-[10px] font-bold text-[#00C2FF]">
              {formatTemp(p.temp)}°
            </div>
            <div className={`text-[8px] font-medium ${
              p.predicted_risk < 30 ? 'text-green-400' :
              p.predicted_risk < 60 ? 'text-yellow-400' :
              'text-red-500'
            }`}>
              {p.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
