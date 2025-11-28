"""
Smart Activity Planner
Optimizes activities based on micro-climate conditions and recommendations
"""

from typing import Dict, List
from datetime import datetime, timedelta

class SmartActivityPlanner:
    """Plan and optimize activities based on micro-climate"""
    
    def __init__(self):
        self.activity_categories = {
            'outdoor_sports': ['running', 'cycling', 'hiking', 'tennis', 'soccer'],
            'water_sports': ['swimming', 'surfing', 'kayaking', 'paddling'],
            'indoor_fitness': ['gym', 'yoga', 'pilates', 'dance', 'martial_arts'],
            'leisure': ['picnic', 'photography', 'sketching', 'sightseeing'],
            'social': ['outdoor_party', 'sports_meet', 'festival', 'concert']
        }
        
        self.optimal_conditions = {
            'running': {'temp_range': (10, 25), 'humidity': (30, 60), 'wind': 'light'},
            'cycling': {'temp_range': (8, 28), 'humidity': (30, 70), 'wind': 'moderate'},
            'hiking': {'temp_range': (5, 30), 'humidity': (30, 80), 'wind': 'moderate'},
            'swimming': {'temp_range': (20, 35), 'humidity': (40, 100), 'wind': 'calm'},
            'outdoor_party': {'temp_range': (15, 28), 'humidity': (30, 70), 'wind': 'light'},
            'picnic': {'temp_range': (12, 27), 'humidity': (30, 70), 'wind': 'light'},
            'photography': {'temp_range': (0, 35), 'humidity': (20, 80), 'wind': 'light'},
            'yoga': {'temp_range': (12, 28), 'humidity': (30, 60), 'wind': 'calm'},
            'tennis': {'temp_range': (12, 28), 'humidity': (30, 70), 'wind': 'light'},
        }

    def plan_week_activities(self, forecasts: List[Dict], user_preferences: Dict = None) -> Dict:
        """
        Plan optimal activities for the entire week
        forecasts: [{'date': 'Mon', 'temp': 25, 'humidity': 60, 'aqi': 100, ...}, ...]
        """
        if not user_preferences:
            user_preferences = {
                'preferred_activities': ['running', 'cycling', 'hiking', 'yoga'],
                'avoid_activities': ['outdoor_party'],  # Too many people
                'available_hours': 2,  # Can do 2 hours of activity
                'health_profile': 'general_fitness'
            }
        
        weekly_plan = []
        
        for idx, forecast in enumerate(forecasts[:7]):
            day_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx]
            
            # Get best activities for this day
            best_activities = self._score_activities_for_day(
                forecast,
                user_preferences['preferred_activities']
            )
            
            if best_activities:
                top_activity = best_activities[0]
                safety_level = 'SAFE' if top_activity['score'] > 70 else 'MODERATE' if top_activity['score'] > 50 else 'RISKY'
                
                weekly_plan.append({
                    'day': day_name,
                    'date': forecast.get('date', f'Day {idx+1}'),
                    'recommended_activity': top_activity['activity'],
                    'activity_score': top_activity['score'],
                    'safety_level': safety_level,
                    'reason': top_activity['reason'],
                    'preparations': self._get_preparations(top_activity['activity'], forecast),
                    'best_time': self._get_best_time(forecast),
                    'duration_minutes': self._estimate_duration(top_activity['score']),
                    'weather_summary': {
                        'temp': forecast.get('temp', 20),
                        'condition': forecast.get('condition', 'Unknown'),
                        'aqi': forecast.get('aqi', 50),
                        'humidity': forecast.get('humidity', 50)
                    }
                })
        
        return {
            'weekly_plan': weekly_plan,
            'summary': self._generate_week_summary(weekly_plan),
            'total_planned_hours': sum([p['duration_minutes'] for p in weekly_plan]) / 60
        }

    def optimize_activity_time(self, daily_forecast: Dict) -> Dict:
        """Find the best time slot in a day for outdoor activities"""
        hourly_data = daily_forecast.get('hourly', [])
        
        if not hourly_data:
            return {'best_time': '10:00 AM', 'reason': 'No hourly data available'}
        
        best_hours = []
        
        for hour_data in hourly_data:
            temp = hour_data.get('temp', 20)
            humidity = hour_data.get('humidity', 50)
            aqi = hour_data.get('aqi', 50)
            wind = hour_data.get('wind_speed', 0)
            
            # Score this hour
            score = 100
            
            # Temperature score
            if temp < 10 or temp > 32:
                score -= 30
            elif temp < 15 or temp > 28:
                score -= 15
            
            # Humidity score
            if humidity < 30 or humidity > 80:
                score -= 20
            
            # AQI score
            if aqi > 150:
                score -= 40
            elif aqi > 100:
                score -= 20
            
            # Wind score
            if wind > 25:
                score -= 20
            
            # Add UV consideration (assume peaks around noon)
            hour = int(hour_data.get('time', '12:00').split(':')[0])
            if 11 <= hour <= 15:
                score -= 10  # Peak UV hours
            
            best_hours.append({
                'time': hour_data.get('time', '12:00'),
                'score': max(0, score),
                'conditions': hour_data
            })
        
        # Sort by score
        best_hours.sort(key=lambda x: x['score'], reverse=True)
        
        best = best_hours[0] if best_hours else None
        
        return {
            'best_time': best['time'] if best else '10:00 AM',
            'score': best['score'] if best else 0,
            'reason': self._explain_best_time(best['conditions'] if best else {}),
            'avoid_times': [h['time'] for h in best_hours[-3:] if best_hours],
            'good_alternatives': [h['time'] for h in best_hours[1:4]]
        }

    def suggest_indoor_alternatives(self, outdoor_activity: str, forecast: Dict) -> List[Dict]:
        """Suggest indoor alternatives when outdoor activities aren't feasible"""
        alternatives = {
            'running': [
                {'activity': 'treadmill', 'reason': 'Similar cardio benefit', 'benefit_score': 0.85},
                {'activity': 'HIIT', 'reason': 'High intensity cardio', 'benefit_score': 0.9},
                {'activity': 'stair climbing', 'reason': 'Leg workout', 'benefit_score': 0.75}
            ],
            'cycling': [
                {'activity': 'stationary bike', 'reason': 'Same muscle groups', 'benefit_score': 0.9},
                {'activity': 'elliptical', 'reason': 'Low impact cardio', 'benefit_score': 0.8},
                {'activity': 'spinning', 'reason': 'Indoor cycling class', 'benefit_score': 0.95}
            ],
            'hiking': [
                {'activity': 'stair climbing', 'reason': 'Simulates elevation', 'benefit_score': 0.7},
                {'activity': 'treadmill incline', 'reason': 'Leg endurance', 'benefit_score': 0.75},
                {'activity': 'indoor rock climbing', 'reason': 'Adventure feel', 'benefit_score': 0.85}
            ],
            'picnic': [
                {'activity': 'movie night', 'reason': 'Social + leisure', 'benefit_score': 0.6},
                {'activity': 'indoor potluck', 'reason': 'Social meal', 'benefit_score': 0.7},
                {'activity': 'board games', 'reason': 'Social activity', 'benefit_score': 0.65}
            ],
            'outdoor_party': [
                {'activity': 'house party', 'reason': 'Indoor social', 'benefit_score': 0.8},
                {'activity': 'gaming tournament', 'reason': 'Competitive fun', 'benefit_score': 0.75},
                {'activity': 'karaoke night', 'reason': 'Entertainment', 'benefit_score': 0.85}
            ]
        }
        
        aqi = forecast.get('aqi', 50)
        if aqi > 150:
            reason = "Poor air quality (AQI > 150)"
        elif forecast.get('temp', 20) > 35:
            reason = "Extreme heat"
        elif forecast.get('temp', 20) < 5:
            reason = "Extreme cold"
        else:
            reason = "Weather conditions not suitable"
        
        result = alternatives.get(outdoor_activity, [
            {'activity': 'yoga', 'reason': 'Indoor fitness', 'benefit_score': 0.7},
            {'activity': 'gym workout', 'reason': 'General fitness', 'benefit_score': 0.75}
        ])
        
        for alt in result:
            alt['weather_reason'] = reason
        
        return result

    def get_activity_schedule(self, weekly_forecasts: List[Dict], user_goals: Dict = None) -> Dict:
        """
        Generate optimized weekly schedule aligned with user goals
        user_goals: {'weekly_distance': 50, 'weekly_gym_sessions': 3, 'rest_days': 1, ...}
        """
        if not user_goals:
            user_goals = {
                'weekly_distance': 50,  # km
                'weekly_gym_sessions': 3,
                'rest_days': 1,
                'mix_activities': True
            }
        
        activities_scheduled = []
        total_distance = 0
        gym_sessions = 0
        
        for forecast in weekly_forecasts[:7]:
            if len(activities_scheduled) >= 7:
                break
            
            # Check if rest day
            if len(activities_scheduled) == user_goals.get('rest_days', 1):
                activities_scheduled.append({
                    'day': forecast.get('day', 'Day'),
                    'activity': 'REST DAY',
                    'reason': 'Recovery and regeneration',
                    'recovery_tips': [
                        'Light stretching (10 min)',
                        'Hydration focus',
                        'Sleep 8+ hours',
                        'Nutrition focus'
                    ]
                })
                continue
            
            # Determine activity type
            if gym_sessions < user_goals.get('weekly_gym_sessions', 3):
                activity = 'gym'
                gym_sessions += 1
            else:
                activity = 'running'  # Default outdoor
            
            score = self._score_activity(activity, forecast)
            
            if score > 50:
                activities_scheduled.append({
                    'day': forecast.get('day', 'Day'),
                    'activity': activity,
                    'score': score,
                    'duration': 60 if activity == 'gym' else 45,
                    'distance': 0 if activity == 'gym' else 10,
                    'conditions': {
                        'temp': forecast.get('temp'),
                        'aqi': forecast.get('aqi')
                    }
                })
                
                if activity != 'gym':
                    total_distance += 10
        
        return {
            'weekly_schedule': activities_scheduled,
            'total_planned_km': total_distance,
            'total_gym_sessions': gym_sessions,
            'goal_achievement': {
                'distance': f"{total_distance}km / {user_goals['weekly_distance']}km target",
                'gym_sessions': f"{gym_sessions} / {user_goals['weekly_gym_sessions']} target"
            }
        }

    # Helper methods
    def _score_activities_for_day(self, forecast: Dict, preferred: List[str]) -> List[Dict]:
        """Score all activities and return top matches"""
        scores = []
        
        for activity in preferred:
            if activity in self.optimal_conditions:
                optimal = self.optimal_conditions[activity]
                score = self._calculate_compatibility_score(forecast, optimal)
                reason = self._get_compatibility_reason(forecast, optimal)
                
                scores.append({
                    'activity': activity,
                    'score': score,
                    'reason': reason
                })
        
        scores.sort(key=lambda x: x['score'], reverse=True)
        return scores

    def _calculate_compatibility_score(self, forecast: Dict, optimal: Dict) -> float:
        """Calculate how well conditions match optimal for activity"""
        score = 100
        
        # Temperature match
        temp = forecast.get('temp', 20)
        temp_min, temp_max = optimal['temp_range']
        if temp < temp_min or temp > temp_max:
            diff = min(abs(temp - temp_min), abs(temp - temp_max))
            score -= min(40, diff * 5)
        
        # Humidity match
        humidity = forecast.get('humidity', 50)
        if humidity > optimal.get('humidity', [0, 100])[1] or humidity < optimal.get('humidity', [0, 100])[0]:
            score -= 15
        
        # AQI consideration
        aqi = forecast.get('aqi', 50)
        if aqi > 150:
            score -= 40
        elif aqi > 100:
            score -= 20
        
        return max(0, score)

    def _get_compatibility_reason(self, forecast: Dict, optimal: Dict) -> str:
        """Generate reason for compatibility score"""
        temp = forecast.get('temp', 20)
        reasons = []
        
        if temp < optimal['temp_range'][0]:
            reasons.append(f"Cold ({temp}°C)")
        elif temp > optimal['temp_range'][1]:
            reasons.append(f"Hot ({temp}°C)")
        else:
            reasons.append(f"Perfect temp ({temp}°C)")
        
        if forecast.get('aqi', 50) > 150:
            reasons.append("Poor air quality")
        
        return " • ".join(reasons)

    def _get_preparations(self, activity: str, forecast: Dict) -> List[str]:
        """Get preparation tips for activity in given conditions"""
        temp = forecast.get('temp', 20)
        humidity = forecast.get('humidity', 50)
        wind = forecast.get('wind_speed', 0)
        
        preps = []
        
        if temp > 30:
            preps.extend(['Bring water (2L+)', 'Wear light clothing', 'Apply sunscreen SPF50+'])
        elif temp < 10:
            preps.extend(['Wear layers', 'Cover extremities', 'Bring hand warmers'])
        
        if humidity > 75:
            preps.append('Extra hydration critical')
        
        if wind > 25:
            preps.append('Secure loose items, adjust route')
        
        return preps or ['Normal conditions - standard preparation']

    def _get_best_time(self, forecast: Dict) -> str:
        """Recommend best time of day"""
        if forecast.get('aqi', 50) > 100:
            return "Morning (before 9 AM)" # Lower pollution
        return "Morning (7-9 AM)" # Cooler, lower UV

    def _estimate_duration(self, score: float) -> int:
        """Estimate safe activity duration based on conditions"""
        if score > 80:
            return 90
        elif score > 60:
            return 60
        elif score > 40:
            return 45
        else:
            return 30

    def _explain_best_time(self, conditions: Dict) -> str:
        """Explain why a time is best"""
        temp = conditions.get('temp', 20)
        aqi = conditions.get('aqi', 50)
        
        if aqi < 100 and 12 <= int(conditions.get('time', '12:00').split(':')[0]) <= 15:
            return "Warm temperature, acceptable air quality"
        elif aqi < 50:
            return "Excellent air quality with good temperature"
        
        return "Balanced conditions"

    def _score_activity(self, activity: str, forecast: Dict) -> float:
        """Quick score for an activity in given conditions"""
        if activity not in self.optimal_conditions:
            return 50
        
        return self._calculate_compatibility_score(forecast, self.optimal_conditions[activity])

    def _generate_week_summary(self, weekly_plan: List[Dict]) -> Dict:
        """Generate summary stats for the week"""
        total_hours = sum([p['duration_minutes'] for p in weekly_plan]) / 60
        safe_days = sum([1 for p in weekly_plan if p['safety_level'] == 'SAFE'])
        
        return {
            'total_planned_hours': total_hours,
            'safe_weather_days': safe_days,
            'best_day': max(weekly_plan, key=lambda x: x['activity_score'])['day'] if weekly_plan else 'N/A',
            'recommendation': f"Plan {total_hours:.1f} hours of activity in optimal conditions across {safe_days} days"
        }


def get_activity_recommendations(forecasts: List[Dict], user_prefs: Dict = None) -> Dict:
    """Main function for API integration"""
    planner = SmartActivityPlanner()
    return planner.plan_week_activities(forecasts, user_prefs)
