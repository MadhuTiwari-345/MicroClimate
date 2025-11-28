"""
Carbon Footprint & Environmental Impact Tracker
Real-time carbon emissions based on weather conditions and activity recommendations
"""

from typing import Dict, List
from datetime import datetime
import math

class CarbonFootprintTracker:
    """Calculate and track environmental impact"""
    
    # Carbon emissions data (kg CO2e)
    EMISSION_FACTORS = {
        'car': 0.21,  # kg CO2 per km
        'public_transport': 0.05,  # kg CO2 per km
        'cycling': 0,  # Zero carbon
        'walking': 0,  # Zero carbon
        'electricity': 0.85,  # kg CO2 per kWh
        'natural_gas': 2.04,  # kg CO2 per cubic meter
        'flying': 0.255,  # kg CO2 per km per person
    }
    
    # Activity to energy/distance mapping
    ACTIVITY_EMISSIONS = {
        'running': {'method': 'walking', 'km_equivalent': 5},  # ~5km run = walking impact
        'cycling': {'method': 'cycling', 'km': 10},
        'driving': {'method': 'car', 'km': 15},
        'public_transport': {'method': 'public_transport', 'km': 20},
        'indoor_gym': {'method': 'electricity', 'kwh': 1.5},  # 1.5 kWh for AC + equipment
        'swimming': {'method': 'electricity', 'kwh': 2},  # Pool heating + circulation
    }

    def __init__(self):
        self.weather_carbon_map = {
            'extreme_heat': {
                'ac_usage_increase': 1.8,  # 80% more AC usage
                'cooling_cost': 2.5,  # kg CO2e per day
                'recommendation': 'Use natural ventilation, adjust thermostat to 26°C'
            },
            'extreme_cold': {
                'heating_usage_increase': 1.6,
                'heating_cost': 3.2,  # kg CO2e per day
                'recommendation': 'Insulate well, use programmable thermostat'
            },
            'poor_air_quality': {
                'indoor_activity_preference': True,
                'air_purifier_cost': 0.5,  # kg CO2e per day
                'recommendation': 'Use HEPA filter, avoid outdoor exercise'
            },
            'ideal_weather': {
                'ac_usage_increase': 0.5,  # Natural cooling
                'carbon_saved': 1.5,  # kg CO2e per day saved
                'recommendation': 'Open windows, go outside, walk/cycle instead of driving'
            }
        }

    def calculate_daily_carbon_footprint(self, activities: List[Dict], weather: Dict) -> Dict:
        """
        Calculate total carbon footprint for a day
        activities: [{'type': 'cycling', 'duration': 30}, ...]
        """
        total_emissions = 0
        activity_breakdown = []
        
        for activity in activities:
            activity_type = activity.get('type', '').lower()
            duration = activity.get('duration', 30)  # minutes
            
            if activity_type in self.ACTIVITY_EMISSIONS:
                mapping = self.ACTIVITY_EMISSIONS[activity_type]
                method = mapping.get('method')
                
                if 'km' in mapping:
                    km = mapping['km']
                    emissions = km * self.EMISSION_FACTORS.get(method, 0)
                elif 'kwh' in mapping:
                    kwh = mapping['kwh'] * (duration / 60)  # Adjust by duration
                    emissions = kwh * self.EMISSION_FACTORS.get(method, 0)
                else:
                    emissions = 0
                
                total_emissions += emissions
                activity_breakdown.append({
                    'activity': activity_type,
                    'duration_minutes': duration,
                    'emissions_kg_co2': round(emissions, 3),
                    'carbon_intensity': 'HIGH' if emissions > 3 else 'MEDIUM' if emissions > 1 else 'LOW'
                })
        
        # Weather impact adjustments
        weather_impact = self._calculate_weather_carbon_impact(weather)
        total_emissions += weather_impact['daily_emissions']
        
        return {
            'total_daily_emissions_kg_co2': round(total_emissions, 2),
            'activity_breakdown': activity_breakdown,
            'weather_impact': weather_impact,
            'daily_target': 8,  # kg CO2e target
            'status': 'UNDER' if total_emissions < 8 else 'AT' if total_emissions < 10 else 'OVER',
            'percentage_of_target': round((total_emissions / 8) * 100, 1)
        }

    def get_eco_friendly_recommendations(self, weather: Dict, current_activity: str) -> List[Dict]:
        """Get low-carbon alternative recommendations"""
        recommendations = []
        
        temp = weather.get('temp', 20)
        aqi = weather.get('aqi', 50)
        humidity = weather.get('humidity', 50)
        
        # Temperature-based recommendations
        if temp > 30:
            recommendations.append({
                'emoji': '🌳',
                'suggestion': 'Exercise outdoors in shade instead of air-conditioned gym',
                'carbon_savings': 2.5,
                'difficulty': 'EASY',
                'time_to_implement': 'Immediate'
            })
        
        if temp > 25:
            recommendations.append({
                'emoji': '🚴',
                'suggestion': 'Cycle or walk instead of driving short distances (<3km)',
                'carbon_savings': 3.5,
                'difficulty': 'MEDIUM',
                'time_to_implement': 'Today'
            })
        
        # Air quality recommendations
        if aqi < 100:  # Good AQI
            recommendations.append({
                'emoji': '🌬️',
                'suggestion': 'Outdoor activity is safe - open windows, disable AC',
                'carbon_savings': 2.0,
                'difficulty': 'EASY',
                'time_to_implement': 'Now'
            })
        else:
            recommendations.append({
                'emoji': '🏠',
                'suggestion': 'Stay indoors, use natural ventilation where possible',
                'carbon_savings': 1.5,
                'difficulty': 'EASY',
                'time_to_implement': 'Now'
            })
        
        # General recommendations
        recommendations.extend([
            {
                'emoji': '⚡',
                'suggestion': 'Use LED lights and unplug standby devices',
                'carbon_savings': 0.8,
                'difficulty': 'EASY',
                'time_to_implement': 'Today'
            },
            {
                'emoji': '💧',
                'suggestion': 'Take shorter showers (5 min max)',
                'carbon_savings': 1.2,
                'difficulty': 'MEDIUM',
                'time_to_implement': 'Daily'
            },
            {
                'emoji': '🍃',
                'suggestion': 'Choose public transport over personal vehicle',
                'carbon_savings': 4.0,
                'difficulty': 'HARD',
                'time_to_implement': 'This week'
            }
        ])
        
        return recommendations[:5]

    def get_monthly_carbon_report(self, historical_data: List[Dict] = None) -> Dict:
        """Generate monthly carbon footprint report"""
        if not historical_data:
            # Generate sample data
            daily_emissions = [
                7.2, 8.5, 6.8, 9.1, 7.5, 8.2, 6.9,
                8.8, 7.1, 9.3, 6.5, 8.7, 7.4,
                9.0, 6.8, 8.1, 7.6, 8.9, 7.2, 8.4
            ]
            historical_data = [{'date': f'Day {i+1}', 'emissions': e} for i, e in enumerate(daily_emissions)]
        
        total_emissions = sum(d.get('emissions', 0) for d in historical_data)
        avg_emissions = total_emissions / len(historical_data) if historical_data else 0
        
        return {
            'month': datetime.now().strftime('%B %Y'),
            'total_emissions_kg_co2': round(total_emissions, 2),
            'average_daily_emissions': round(avg_emissions, 2),
            'target_monthly': 240,  # 8kg * 30 days
            'status': 'GOOD' if total_emissions < 240 else 'NEEDS_IMPROVEMENT',
            'trend': 'IMPROVING' if historical_data[-1]['emissions'] < historical_data[0]['emissions'] else 'WORSENING',
            'equivalent_to': {
                'miles_driven': round(total_emissions / 0.21, 1),
                'trees_needed_to_offset': round(total_emissions / 21, 1),  # 1 tree absorbs ~21kg CO2/year
                'flights_equivalent': round(total_emissions / 200, 2)  # 200kg per transatlantic flight
            },
            'best_day': max(historical_data, key=lambda x: x.get('emissions', 0))['date'] if historical_data else 'N/A',
            'worst_day': max(historical_data, key=lambda x: x.get('emissions', 0))['date'] if historical_data else 'N/A'
        }

    def get_carbon_offset_options(self) -> List[Dict]:
        """Get carbon offset options"""
        return [
            {
                'option': 'Plant 1 tree',
                'cost_usd': 1,
                'offsets_kg_co2': 21,  # Over 1 year
                'time_to_maturity': '30-40 years',
                'environmental_benefit': 'Carbon sequestration, habitat creation',
                'link': 'https://onetreeplanted.org'
            },
            {
                'option': 'Renewable energy credit (100 kWh)',
                'cost_usd': 5,
                'offsets_kg_co2': 85,
                'time_to_effect': 'Immediate',
                'environmental_benefit': 'Supports solar/wind farms',
                'link': 'https://www.carbontrust.com'
            },
            {
                'option': 'Methane capture project (1 ton CO2e)',
                'cost_usd': 10,
                'offsets_kg_co2': 1000,
                'time_to_effect': 'Immediate',
                'environmental_benefit': 'Prevents landfill methane emissions',
                'link': 'https://www.projectdrawdown.org'
            },
            {
                'option': 'Support forest conservation',
                'cost_usd': 3,
                'offsets_kg_co2': 50,
                'time_to_maturity': 'Ongoing',
                'environmental_benefit': 'Protects existing carbon sinks',
                'link': 'https://www.rainforest-alliance.org'
            }
        ]

    def get_carbon_score(self, weekly_emissions: float) -> Dict:
        """Generate carbon score (0-100, higher is better)"""
        # Target: 56 kg CO2e per week (8 kg/day * 7)
        target_weekly = 56
        
        if weekly_emissions <= target_weekly * 0.5:
            score = 95
            rating = 'EXCELLENT 🌟'
        elif weekly_emissions <= target_weekly * 0.75:
            score = 80
            rating = 'VERY GOOD 👍'
        elif weekly_emissions <= target_weekly:
            score = 65
            rating = 'GOOD ✓'
        elif weekly_emissions <= target_weekly * 1.25:
            score = 50
            rating = 'AVERAGE ○'
        elif weekly_emissions <= target_weekly * 1.5:
            score = 35
            rating = 'NEEDS_IMPROVEMENT ⚠️'
        else:
            score = 20
            rating = 'CRITICAL 🚨'
        
        return {
            'carbon_score': score,
            'rating': rating,
            'weekly_emissions': round(weekly_emissions, 2),
            'weekly_target': target_weekly,
            'status': 'BELOW_TARGET' if weekly_emissions <= target_weekly else 'ABOVE_TARGET',
            'reduction_needed': round(max(0, weekly_emissions - target_weekly), 2),
            'achievements': self._get_carbon_achievements(score)
        }

    def _calculate_weather_carbon_impact(self, weather: Dict) -> Dict:
        """Calculate carbon cost of weather conditions"""
        temp = weather.get('temp', 20)
        humidity = weather.get('humidity', 50)
        
        base_emissions = 2  # kg CO2e for daily operations
        
        if temp > 35:
            impact = self.weather_carbon_map['extreme_heat']
            emissions = impact['cooling_cost'] * 1.5
        elif temp < 5:
            impact = self.weather_carbon_map['extreme_cold']
            emissions = impact['heating_cost']
        elif 15 <= temp <= 25 and humidity < 70:
            impact = self.weather_carbon_map['ideal_weather']
            emissions = base_emissions * 0.5  # Reduced emissions
        else:
            emissions = base_emissions
        
        return {
            'daily_emissions': emissions,
            'weather_impact': 'POSITIVE' if emissions < base_emissions else 'NEUTRAL' if emissions == base_emissions else 'NEGATIVE',
            'recommendation': impact.get('recommendation', 'Maintain current practices')
        }

    def _get_carbon_achievements(self, score: float) -> List[str]:
        """Get achievements based on carbon score"""
        achievements = []
        if score >= 95:
            achievements.append('🌱 Carbon Neutral Champion')
            achievements.append('♻️ Eco Warrior')
        elif score >= 80:
            achievements.append('🌿 Green Guardian')
            achievements.append('💚 Climate Conscious')
        elif score >= 65:
            achievements.append('📉 Emissions Reducer')
        elif score >= 50:
            achievements.append('🎯 On Track')
        else:
            achievements.append('⚠️ Action Needed')
        return achievements

    def get_comprehensive_carbon_report(self, activities: List[Dict], weather: Dict) -> Dict:
        """Generate complete carbon report"""
        daily_report = self.calculate_daily_carbon_footprint(activities, weather)
        weekly_emissions = daily_report['total_daily_emissions_kg_co2'] * 7
        
        return {
            'daily_footprint': daily_report,
            'carbon_score': self.get_carbon_score(weekly_emissions),
            'eco_recommendations': self.get_eco_friendly_recommendations(weather, 'general'),
            'carbon_offsets': self.get_carbon_offset_options(),
            'monthly_report': self.get_monthly_carbon_report(),
            'generated_at': datetime.now().isoformat()
        }


def get_carbon_analysis(weather_data: Dict, user_activities: List[Dict] = None) -> Dict:
    """Main function for API integration"""
    if not user_activities:
        user_activities = [
            {'type': 'cycling', 'duration': 30},
            {'type': 'public_transport', 'duration': 45},
            {'type': 'indoor_gym', 'duration': 60}
        ]
    
    tracker = CarbonFootprintTracker()
    return tracker.get_comprehensive_carbon_report(user_activities, weather_data)
