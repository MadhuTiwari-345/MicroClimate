// Test: Simulate complete ExplorePage search flow
async function testExplorePage() {
  console.log('=== ExplorePage Search Flow Test ===\n');
  
  // Test 1: Direct city search (handleLocationSearch)
  console.log('Test 1: Direct City Search');
  console.log('-'.repeat(40));
  
  try {
    const query = 'Mumbai';
    console.log(`Searching for: "${query}"`);
    
    // Step 1: fetchForecastByCity from api.ts
    const res = await fetch(`http://127.0.0.1:8000/weather/forecast?city=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    
    console.log(`✓ City: ${data.city}`);
    console.log(`✓ Temperature: ${data.current.temperature}°C`);
    console.log(`✓ Humidity: ${data.current.humidity}%`);
    console.log(`✓ Wind: ${data.current.windSpeed} km/h`);
    console.log(`✓ AQI: ${data.aqi}`);
    console.log('✓ Search successful!\n');
  } catch (err) {
    console.error(`✗ Error: ${err.message}\n`);
  }
  
  // Test 2: Marker position update (with reverse geocoding)
  console.log('Test 2: Marker Position Update (with reverse geocoding)');
  console.log('-'.repeat(40));
  
  try {
    const lat = 12.9716, lon = 77.5946; // Bangalore
    console.log(`Marker position: (${lat}, ${lon})`);
    
    // Step 1: getCityFromCoordinates
    const cityRes = await fetch(`http://127.0.0.1:8000/api/city?lat=${lat}&lon=${lon}`);
    const cityName = await cityRes.text();
    console.log(`✓ Reverse geocoded city: "${cityName}"`);
    
    // Step 2: fetchForecastByCity with the geocoded name
    const forecastRes = await fetch(`http://127.0.0.1:8000/weather/forecast?city=${encodeURIComponent(cityName)}`);
    if (!forecastRes.ok) throw new Error('Forecast API failed');
    const weatherData = await forecastRes.json();
    
    console.log(`✓ City from backend: ${weatherData.city}`);
    console.log(`✓ Temperature: ${weatherData.current.temperature}°C`);
    console.log(`✓ Humidity: ${weatherData.current.humidity}%`);
    console.log(`✓ Wind: ${weatherData.current.windSpeed} km/h`);
    console.log('✓ Marker update successful!\n');
  } catch (err) {
    console.error(`✗ Error: ${err.message}\n`);
  }
  
  // Test 3: Search with coordinate fallback
  console.log('Test 3: Search with Coordinate Fallback');
  console.log('-'.repeat(40));
  
  try {
    const lat = 40.7128, lon = -74.0060; // New York
    console.log(`Searching with coordinates: (${lat}, ${lon})`);
    
    // Try reverse geocode first
    const cityRes = await fetch(`http://127.0.0.1:8000/api/city?lat=${lat}&lon=${lon}`);
    let searchQuery = await cityRes.text();
    
    // If geocode returns something too specific, use coordinates
    if (searchQuery.length > 20) {
      searchQuery = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      console.log(`✓ Using coordinate fallback: "${searchQuery}"`);
    } else {
      console.log(`✓ Using geocoded name: "${searchQuery}"`);
    }
    
    const forecastRes = await fetch(`http://127.0.0.1:8000/weather/forecast?city=${encodeURIComponent(searchQuery)}`);
    if (!forecastRes.ok) throw new Error('Forecast API failed');
    const weatherData = await forecastRes.json();
    
    console.log(`✓ City: ${weatherData.city}`);
    console.log(`✓ Temperature: ${weatherData.current.temperature}°C`);
    console.log('✓ Coordinate fallback successful!\n');
  } catch (err) {
    console.error(`✗ Error: ${err.message}\n`);
  }
  
  console.log('=== All Tests Complete ===');
}

testExplorePage();
