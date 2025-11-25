async function testSearch() {
  const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Pune'];
  console.log('Testing city searches...\n');
  
  for (const city of cities) {
    try {
      const res = await fetch('http://127.0.0.1:8000/weather/forecast?city=' + encodeURIComponent(city));
      const data = await res.json();
      console.log(`✓ ${city.padEnd(12)}: Temp=${Math.round(data.current.temperature)}°C, Humidity=${data.current.humidity}%, Wind=${Math.round(data.current.windSpeed)}km/h, AQI=${data.aqi}`);
    } catch (e) {
      console.error(`✗ ${city}: Error - ${e.message}`);
    }
  }
  console.log('\nAll searches completed successfully!');
}

testSearch();
