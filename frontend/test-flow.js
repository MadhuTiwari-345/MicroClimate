// Simulate the frontend search flow
async function simulateFrontendSearch(cityQuery) {
  console.log(`\n📍 Searching for: ${cityQuery}`);
  
  try {
    // Step 1: fetchForecastByCity (from api.ts)
    console.log(`  → Fetching forecast for "${cityQuery}"...`);
    const res = await fetch(`http://127.0.0.1:8000/weather/forecast?city=${encodeURIComponent(cityQuery)}`);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch forecast (Status: ${res.status})`);
    }
    
    const data = await res.json();
    
    // Verify all required fields exist
    console.log(`  ✓ Response received from backend`);
    console.log(`    - City: ${data.city}`);
    console.log(`    - Coordinates: (${data.lat.toFixed(4)}, ${data.lon.toFixed(4)})`);
    console.log(`    - Current temp: ${data.current.temperature}°C`);
    console.log(`    - Humidity: ${data.current.humidity}%`);
    console.log(`    - Wind speed: ${data.current.windSpeed} km/h`);
    console.log(`    - AQI: ${data.aqi}`);
    console.log(`    - Daily forecasts: ${data.daily?.length || 0} days`);
    console.log(`    - Hourly forecasts: ${data.hourly?.length || 0} hours`);
    
    return data;
  } catch (err) {
    console.error(`  ✗ Error: ${err.message}`);
    return null;
  }
}

// Test with multiple cities
async function runTests() {
  console.log('=== Frontend Search Flow Test ===');
  const testCities = ['Delhi', 'Mumbai', 'Bangalore', 'New York', 'London'];
  
  for (const city of testCities) {
    await simulateFrontendSearch(city);
  }
  
  console.log('\n=== Test Complete ===');
}

runTests();
