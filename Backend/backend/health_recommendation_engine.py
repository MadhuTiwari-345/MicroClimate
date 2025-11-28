"""
AI-Powered Health Recommendation Engine
Provides personalized health & activity recommendations based on micro-climate data
"""

from typing import Dict, List
import json

class HealthRecommendationEngine:
    """Generates health recommendations based on weather conditions"""
    
    def __init__(self):
        self.health_profiles = {
            'asthma': {
                'risk_factors': ['high_pm25', 'high_pollen', 'high_humidity', 'temperature_extreme'],
                'safe_activities': ['indoor_yoga', 'swimming', 'gym'],
                'warning_threshold': 60
            },
            'cardiac': {
                'risk_factors': ['high_temperature', 'low_humidity', 'high_aqi', 'extreme_wind'],
                'safe_activities': ['slow_walk', 'meditation', 'tai_chi'],
                'warning_threshold': 50
            },
            'arthritis': {
                'risk_factors': ['low_temperature', 'high_humidity', 'pressure_drop'],
                'safe_activities': ['swimming', 'indoor_exercise', 'yoga'],
                'warning_threshold': 65
            },
            'general_fitness': {
                'risk_factors': ['extreme_heat', 'extreme_cold', 'high_uv'],
                'safe_activities': ['running', 'cycling', 'hiking'],
                'warning_threshold': 40
            }
        }
        
        self.activity_weather_matrix = {
            'running': {'temp_range': (10, 25), 'humidity_max': 70, 'wind_max': 20, 'aqi_max': 100},
            'cycling': {'temp_range': (8, 28), 'humidity_max': 75, 'wind_max': 25, 'aqi_max': 120},
            'hiking': {'temp_range': (5, 30), 'humidity_max': 80, 'wind_max': 30, 'aqi_max': 150},
            'outdoor_sports': {'temp_range': (12, 28), 'humidity_max': 70, 'wind_max': 20, 'aqi_max': 100},
            'swimming': {'temp_range': (20, 35), 'humidity_max': 100, 'wind_max': 40, 'aqi_max': 200},
            'yoga': {'temp_range': (15, 28), 'humidity_max': 70, 'wind_max': 15, 'aqi_max': 80},
            'meditation': {'temp_range': (10, 30), 'humidity_max': 100, 'wind_max': 100, 'aqi_max': 200},
        }

    def calculate_health_index(self, weather: Dict, health_profile: str = 'general_fitness') -> Dict:
        """
        Calculate personalized health risk index (0-100)
        Lower = better conditions
        """
        profile = self.health_profiles.get(health_profile, self.health_profiles['general_fitness'])
        risk_score = 0
        risk_factors_hit = []
        
        # Temperature risk
        temp = weather.get('temp', 20)
        if temp < 0 or temp > 40:
            risk_score += 30
            risk_factors_hit.append(f"Extreme temperature: {temp}°C")
        elif temp < 10 or temp > 35:
            risk_score += 20
            risk_factors_hit.append(f"Temperature stress: {temp}°C")
        
        # Humidity risk
        humidity = weather.get('humidity', 50)
        if humidity > 85 or humidity < 20:
            risk_score += 25
            risk_factors_hit.append(f"Extreme humidity: {humidity}%")
        elif humidity > 75 or humidity < 30:
            risk_score += 15
            risk_factors_hit.append(f"Humidity stress: {humidity}%")
        
        # AQI/Pollution risk
        aqi = weather.get('aqi', 50)
        if aqi > 300:
            risk_score += 40
            risk_factors_hit.append(f"Hazardous AQI: {aqi}")
        elif aqi > 200:
            risk_score += 30
            risk_factors_hit.append(f"Very unhealthy AQI: {aqi}")
        elif aqi > 150:
            risk_score += 20
            risk_factors_hit.append(f"Unhealthy AQI: {aqi}")
        elif aqi > 100:
            risk_score += 10
            risk_factors_hit.append(f"Moderate AQI: {aqi}")
        
        # UV risk
        uv = weather.get('uv_index', 3)
        if uv > 10:
            risk_score += 25
            risk_factors_hit.append(f"Extreme UV: {uv}")
        elif uv > 7:
            risk_score += 15
            risk_factors_hit.append(f"High UV: {uv}")
        
        # Wind risk
        wind = weather.get('wind_speed', 5)
        if wind > 30:
            risk_score += 20
            risk_factors_hit.append(f"High wind: {wind} km/h")
        
        # Normalize to 0-100
        risk_score = min(100, max(0, risk_score))
        
        return {
            'health_risk_index': risk_score,
            'risk_factors': risk_factors_hit,
            'warning_level': 'CRITICAL' if risk_score > 80 else 'HIGH' if risk_score > 60 else 'MODERATE' if risk_score > 40 else 'LOW',
            'safe_for_profile': risk_score < profile['warning_threshold']
        }

    def get_activity_recommendations(self, weather: Dict) -> List[Dict]:
        """
        Recommend safe activities based on current weather
        Returns ranked list of activities with compatibility scores
        """
        recommendations = []
        
        for activity, constraints in self.activity_weather_matrix.items():
            compatibility_score = 100
            reasons = []
            
            # Temperature check
            temp = weather.get('temp', 20)
            temp_min, temp_max = constraints['temp_range']
            if temp < temp_min:
                temp_diff = temp_min - temp
                compatibility_score -= min(50, temp_diff * 5)
                reasons.append(f"Too cold ({temp}°C vs {temp_min}°C minimum)")
            elif temp > temp_max:
                temp_diff = temp - temp_max
                compatibility_score -= min(50, temp_diff * 5)
                reasons.append(f"Too hot ({temp}°C vs {temp_max}°C maximum)")
            
            # Humidity check
            humidity = weather.get('humidity', 50)
            if humidity > constraints['humidity_max']:
                compatibility_score -= min(30, (humidity - constraints['humidity_max']) / 2)
                reasons.append(f"High humidity ({humidity}%)")
            
            # Wind check
            wind = weather.get('wind_speed', 5)
            if wind > constraints['wind_max']:
                compatibility_score -= min(20, (wind - constraints['wind_max']))
                reasons.append(f"Strong wind ({wind} km/h)")
            
            # AQI check
            aqi = weather.get('aqi', 50)
            if aqi > constraints['aqi_max']:
                compatibility_score -= min(40, (aqi - constraints['aqi_max']) / 5)
                reasons.append(f"Poor air quality (AQI: {aqi})")
            
            compatibility_score = max(0, compatibility_score)
            
            recommendations.append({
                'activity': activity.replace('_', ' ').title(),
                'compatibility_score': compatibility_score,
                'safety_level': 'EXCELLENT' if compatibility_score > 80 else 'GOOD' if compatibility_score > 60 else 'MODERATE' if compatibility_score > 40 else 'POOR',
                'warnings': reasons,
                'estimated_duration': self._get_duration_estimate(activity, compatibility_score)
            })
        
        # Sort by compatibility score descending
        recommendations.sort(key=lambda x: x['compatibility_score'], reverse=True)
        return recommendations[:5]  # Return top 5

    def get_health_tips(self, weather: Dict, health_profile: str = 'general_fitness') -> List[str]:
        """Generate personalized health tips based on conditions"""
        tips = []
        
        temp = weather.get('temp', 20)
        humidity = weather.get('humidity', 50)
        aqi = weather.get('aqi', 50)
        wind = weather.get('wind_speed', 5)
        uv = weather.get('uv_index', 3)
        
        # Temperature tips
        if temp > 32:
            tips.append("☀️ Stay hydrated - drink water every 15-20 minutes during activity")
            tips.append("🧴 Apply SPF 50+ sunscreen; reapply every 2 hours")
            tips.append("🏠 Schedule intense workouts for early morning or evening")
        elif temp < 5:
            tips.append("❄️ Layer up with moisture-wicking base layer + insulation + wind-proof shell")
            tips.append("🤚 Protect extremities - gloves, hat, and warm socks essential")
            tips.append("⏱️ Warm up for 15+ minutes before intense activity")
        
        # Humidity tips
        if humidity > 80:
            tips.append("💧 Heat + humidity = reduced cooling - take frequent breaks")
            tips.append("🌬️ Seek shade or indoor air conditioning if doing cardio")
        elif humidity < 30:
            tips.append("🌵 Low humidity causes rapid dehydration - drink more water than usual")
            tips.append("💧 Use lip balm and moisturizer to prevent dry skin")
        
        # AQI tips
        if aqi > 200:
            tips.append("⚠️ CRITICAL AIR QUALITY - Stay indoors; use N95/P100 if venturing out")
            tips.append("🚫 Avoid strenuous activity; indoor workouts recommended")
        elif aqi > 150:
            tips.append("⚠️ Unhealthy air quality - Consider indoor activities instead")
            tips.append("😷 If outdoors, use N95 mask during exercise")
        elif aqi > 100:
            tips.append("⚡ Moderate pollution - Reduce intense outdoor exercise")
            tips.append("🌳 Prefer parks with vegetation for better air filtering")
        
        # UV tips
        if uv > 10:
            tips.append("🚨 EXTREME UV - Limit sun exposure; wear hat + UV sunglasses")
            tips.append("☂️ Seek shade whenever possible; reapply sunscreen frequently")
        elif uv > 7:
            tips.append("🕶️ High UV index - Sunscreen, sunglasses, and hat essential")
        
        # Wind tips
        if wind > 25:
            tips.append("💨 High wind speeds - Secure outdoor items; be cautious on heights")
        
        # Profile-specific tips
        if health_profile == 'asthma':
            tips.append("💨 High pollen/pollution days → use inhaler before going out")
        elif health_profile == 'cardiac':
            tips.append("❤️ Avoid exertion in extreme heat/cold; take frequent rest breaks")
        elif health_profile == 'arthritis':
            tips.append("🦵 Low temps + high humidity worsen joint pain - gentle stretching helps")
        
        return list(set(tips))  # Remove duplicates

    def _get_duration_estimate(self, activity: str, compatibility_score: float) -> str:
        """Estimate safe activity duration based on compatibility"""
        base_durations = {
            'running': 30,
            'cycling': 45,
            'hiking': 60,
            'outdoor_sports': 40,
            'swimming': 45,
            'yoga': 60,
            'meditation': 30
        }
        
        base = base_durations.get(activity, 45)
        
        if compatibility_score > 80:
            return f"{base} minutes"
        elif compatibility_score > 60:
            return f"{int(base * 0.75)} minutes"
        elif compatibility_score > 40:
            return f"{int(base * 0.5)} minutes"
        else:
            return "Not recommended"

    def get_comprehensive_health_report(self, weather: Dict, health_profile: str = 'general_fitness') -> Dict:
        """Generate complete health assessment"""
        return {
            'health_index': self.calculate_health_index(weather, health_profile),
            'recommended_activities': self.get_activity_recommendations(weather),
            'health_tips': self.get_health_tips(weather, health_profile),
            'profile': health_profile,
            'generated_at': weather.get('timestamp', 'now')
        }


# Standalone function for API integration
def get_health_recommendations(lat: float, lon: float, weather_data: Dict, health_profile: str = 'general_fitness') -> Dict:
    """
    Main function to get health recommendations
    Call from weather router endpoint
    """
    engine = HealthRecommendationEngine()
    return engine.get_comprehensive_health_report(weather_data, health_profile)
