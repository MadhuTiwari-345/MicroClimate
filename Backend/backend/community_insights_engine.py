"""
Community Insights & Social Weather Comparison Engine
Track how your micro-climate compares to other locations globally
"""

from typing import Dict, List
from datetime import datetime, timedelta
import random

class CommunityInsightsEngine:
    """Generate community-based weather insights and comparisons"""
    
    def __init__(self):
        # Simulated community data - in production, pull from database
        self.community_locations = {
            'delhi': {'lat': 28.7041, 'lon': 77.1025, 'population_density': 'very_high', 'region': 'India'},
            'noida': {'lat': 28.5921, 'lon': 77.3707, 'population_density': 'high', 'region': 'India'},
            'bangalore': {'lat': 12.9716, 'lon': 77.5946, 'population_density': 'high', 'region': 'India'},
            'nyc': {'lat': 40.7128, 'lon': -74.0060, 'population_density': 'very_high', 'region': 'USA'},
            'london': {'lat': 51.5074, 'lon': -0.1278, 'population_density': 'high', 'region': 'UK'},
            'tokyo': {'lat': 35.6762, 'lon': 139.6503, 'population_density': 'very_high', 'region': 'Japan'},
        }

    def calculate_global_comparison(self, your_weather: Dict, your_location: str) -> Dict:
        """Compare your weather to global cities"""
        comparisons = []
        your_temp = your_weather.get('temp', 20)
        your_humidity = your_weather.get('humidity', 50)
        your_aqi = your_weather.get('aqi', 50)
        
        for location, data in self.community_locations.items():
            if location.lower() == your_location.lower():
                continue
            
            # Simulate weather data for comparison
            simulated_weather = self._simulate_weather_for_location(location)
            
            temp_diff = abs(your_temp - simulated_weather['temp'])
            humidity_diff = abs(your_humidity - simulated_weather['humidity'])
            aqi_diff = abs(your_aqi - simulated_weather['aqi'])
            
            similarity_score = max(0, 100 - (temp_diff * 2 + humidity_diff * 0.5 + aqi_diff * 0.3))
            
            comparisons.append({
                'location': location.title(),
                'temperature': simulated_weather['temp'],
                'humidity': simulated_weather['humidity'],
                'aqi': simulated_weather['aqi'],
                'weather_condition': simulated_weather['condition'],
                'similarity_score': similarity_score,
                'interesting_fact': self._get_interesting_fact(location, your_weather, simulated_weather),
                'time_of_day_difference': data.get('time_offset', 0)
            })
        
        # Sort by similarity
        comparisons.sort(key=lambda x: x['similarity_score'], reverse=True)
        return {
            'your_location': your_location,
            'global_comparisons': comparisons[:5],
            'insights': self._generate_comparison_insights(your_weather, comparisons)
        }

    def get_trending_weather_events(self) -> List[Dict]:
        """Get trending weather events happening globally"""
        trending = [
            {
                'event': 'Heatwave in Northern Europe',
                'location': 'Scandinavia',
                'severity': 'HIGH',
                'affected_people': '15M+',
                'temperature_anomaly': '+8°C above normal',
                'emoji': '🔥',
                'insights': [
                    'Highest temperatures in 50 years',
                    'Increased wildfire risk',
                    'Health emergency declared'
                ]
            },
            {
                'event': 'Monsoon Intensification',
                'location': 'South Asia',
                'severity': 'CRITICAL',
                'affected_people': '50M+',
                'rainfall_anomaly': '+40% above normal',
                'emoji': '🌊',
                'insights': [
                    'Flash flooding in low-lying areas',
                    'Landslide warnings in mountain regions',
                    'Agricultural impact assessment ongoing'
                ]
            },
            {
                'event': 'Tropical Cyclone Formation',
                'location': 'Atlantic Basin',
                'severity': 'MEDIUM',
                'affected_people': '10M+',
                'wind_speed': '140 km/h',
                'emoji': '🌪️',
                'insights': [
                    'Expected landfall in 5 days',
                    'Evacuation orders may be issued',
                    'Prepare emergency supplies'
                ]
            },
            {
                'event': 'Unexpected Snowfall',
                'location': 'Australian Alps',
                'severity': 'LOW',
                'affected_people': '5M+',
                'snowfall': '30cm',
                'emoji': '❄️',
                'insights': [
                    'Ski resorts opening early',
                    'Rare weather event for this season',
                    'Tourist activity surge expected'
                ]
            }
        ]
        return trending

    def get_regional_climate_patterns(self, region: str = None) -> Dict:
        """Get climate patterns for a region"""
        patterns = {
            'south_asia': {
                'dominant_pattern': 'Monsoon Circulation',
                'current_phase': 'Southwest Monsoon (Strong)',
                'next_phase_in': '2 months',
                'typical_weather': 'Heavy rainfall, high humidity, cooler temps',
                'preparedness': ['Ensure drainage systems', 'Stock up on essentials', 'Check roof safety'],
                'affected_cities': ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Hyderabad']
            },
            'north_america': {
                'dominant_pattern': 'Jet Stream Variability',
                'current_phase': 'Summer Heat Ridge',
                'next_phase_in': '6 weeks',
                'typical_weather': 'Extreme heat, low humidity, clear skies',
                'preparedness': ['AC maintenance', 'Hydration supplies', 'UV protection'],
                'affected_cities': ['New York', 'Los Angeles', 'Chicago', 'Dallas']
            },
            'europe': {
                'dominant_pattern': 'Atlantic Oscillation',
                'current_phase': 'High Pressure System',
                'next_phase_in': '10 days',
                'typical_weather': 'Sunny, warm, occasional thunderstorms',
                'preparedness': ['Sunscreen supply', 'Umbrella availability', 'Heat stress prevention'],
                'affected_cities': ['London', 'Paris', 'Berlin', 'Rome']
            }
        }
        return patterns.get(region, patterns['south_asia'])

    def get_community_alerts(self, location: str, health_profile: str = 'general') -> List[Dict]:
        """Get alerts relevant to your location and health profile"""
        alerts = [
            {
                'priority': 'CRITICAL',
                'type': 'Health Alert',
                'message': '⚠️ Air quality expected to worsen in next 6 hours - masks recommended for outdoor activity',
                'affected_groups': ['asthma', 'cardiac', 'elderly'],
                'actions': ['Cancel outdoor plans', 'Use air purifier', 'Consult doctor if symptoms appear']
            },
            {
                'priority': 'HIGH',
                'type': 'Weather Alert',
                'message': '⛈️ Severe thunderstorms expected 3-5 PM - seek shelter immediately',
                'affected_groups': ['general', 'outdoor_workers'],
                'actions': ['Check weather updates', 'Delay outdoor work', 'Secure loose items']
            },
            {
                'priority': 'MEDIUM',
                'type': 'UV Alert',
                'message': '☀️ Extreme UV index (10+) - sunscreen and protective gear recommended',
                'affected_groups': ['general', 'outdoor_enthusiasts'],
                'actions': ['Apply sunscreen SPF50+', 'Wear UV sunglasses', 'Stay in shade 11 AM-3 PM']
            },
            {
                'priority': 'MEDIUM',
                'type': 'Pollen Alert',
                'message': '🌾 High pollen count (500+ particles/m³) - stay indoors if allergic',
                'affected_groups': ['asthma', 'allergy_prone'],
                'actions': ['Keep windows closed', 'Use antihistamine', 'Run HEPA filter']
            }
        ]
        
        # Filter by health profile
        filtered = [a for a in alerts if health_profile in a['affected_groups'] or 'general' in a['affected_groups']]
        return filtered[:3]  # Top 3 alerts

    def get_peer_insights(self, your_location: str) -> Dict:
        """Get insights from other users in same location"""
        return {
            'total_active_users': random.randint(500, 5000),
            'users_in_your_location': random.randint(50, 500),
            'recent_reports': [
                {
                    'user': 'Alex',
                    'time_ago': '30 minutes',
                    'report': '🏃 Great running weather! Did 10km, perfect conditions.',
                    'likes': random.randint(10, 100)
                },
                {
                    'user': 'Sarah',
                    'time_ago': '2 hours',
                    'report': '😷 Air quality getting worse, cancelled outdoor plans.',
                    'likes': random.randint(5, 50)
                },
                {
                    'user': 'Mike',
                    'time_ago': '4 hours',
                    'report': '🌤️ Beautiful day after the rain, streets are clean!',
                    'likes': random.randint(20, 150)
                },
                {
                    'user': 'Emma',
                    'time_ago': '6 hours',
                    'report': '⚠️ Watch out for flooding near sector 18',
                    'likes': random.randint(30, 200)
                }
            ],
            'community_sentiment': 'POSITIVE',  # POSITIVE, NEUTRAL, NEGATIVE
            'most_discussed_topic': 'Air quality improvement after monsoon'
        }

    def get_climate_streak_stats(self, location: str) -> Dict:
        """Gamification - climate streaks and stats"""
        return {
            'days_without_extreme_weather': random.randint(10, 60),
            'consecutive_good_air_quality_days': random.randint(3, 30),
            'perfect_workout_days_this_month': random.randint(8, 20),
            'near_miss_events': random.randint(1, 5),
            'achievements': [
                {'title': '☀️ Sun Seeker', 'description': '10 consecutive clear-sky days', 'earned': True},
                {'title': '💨 Storm Dodger', 'description': 'Avoided 3 severe weather events', 'earned': True},
                {'title': '🏃 Perfect Runner', 'description': '50 perfect-condition running days', 'earned': False},
                {'title': '❄️ Winter Warrior', 'description': 'Exercised in 10+ days below 5°C', 'earned': False},
            ]
        }

    def _simulate_weather_for_location(self, location: str) -> Dict:
        """Simulate weather for demonstration"""
        base_temps = {
            'delhi': 35,
            'noida': 34,
            'bangalore': 28,
            'nyc': 25,
            'london': 20,
            'tokyo': 26
        }
        
        base_temp = base_temps.get(location, 25)
        variance = random.uniform(-3, 3)
        
        return {
            'temp': base_temp + variance,
            'humidity': random.uniform(40, 80),
            'aqi': random.uniform(30, 200),
            'condition': random.choice(['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Clear'])
        }

    def _get_interesting_fact(self, location: str, your_weather: Dict, their_weather: Dict) -> str:
        """Generate interesting comparison fact"""
        your_temp = your_weather.get('temp', 20)
        their_temp = their_weather.get('temp', 20)
        diff = abs(your_temp - their_weather.get('temp', 20))
        
        facts = [
            f"🌡️ {location.title()} is {diff:.1f}°C {'warmer' if their_temp > your_temp else 'cooler'} than you",
            f"💧 {location.title()} has {'higher' if their_weather['humidity'] > your_weather['humidity'] else 'lower'} humidity levels",
            f"😷 {location.title()} air quality is currently {'better' if their_weather['aqi'] < your_weather['aqi'] else 'worse'}",
            f"☀️ While you have {your_weather.get('condition', 'unknown')} weather, {location.title()} has {their_weather['condition']}",
        ]
        return random.choice(facts)

    def _generate_comparison_insights(self, your_weather: Dict, comparisons: List[Dict]) -> List[str]:
        """Generate insights from comparison"""
        insights = []
        
        if comparisons:
            most_similar = comparisons[0]
            insights.append(f"👥 {most_similar['location']} has the most similar climate to you right now ({most_similar['similarity_score']:.0f}% match)")
        
        warmer_locations = [c for c in comparisons if c['temperature'] > your_weather.get('temp', 20)]
        if warmer_locations:
            insights.append(f"🔥 It's warmer in {', '.join([c['location'] for c in warmer_locations[:2]])}")
        
        cooler_locations = [c for c in comparisons if c['temperature'] < your_weather.get('temp', 20)]
        if cooler_locations:
            insights.append(f"❄️ It's cooler in {', '.join([c['location'] for c in cooler_locations[:2]])}")
        
        return insights

    def get_comprehensive_community_report(self, location: str, health_profile: str = 'general') -> Dict:
        """Generate complete community insights"""
        return {
            'trending_events': self.get_trending_weather_events(),
            'regional_patterns': self.get_regional_climate_patterns(),
            'community_alerts': self.get_community_alerts(location, health_profile),
            'peer_insights': self.get_peer_insights(location),
            'climate_stats': self.get_climate_streak_stats(location),
            'generated_at': datetime.now().isoformat()
        }


def get_community_insights(location: str, weather_data: Dict = None, health_profile: str = 'general') -> Dict:
    """Main function for API integration"""
    engine = CommunityInsightsEngine()
    if weather_data:
        base_report = engine.calculate_global_comparison(weather_data, location)
    else:
        base_report = {'your_location': location}
    
    full_report = engine.get_comprehensive_community_report(location, health_profile)
    return {**base_report, **full_report}
