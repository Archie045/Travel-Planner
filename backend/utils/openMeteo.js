import axios from 'axios';

const openMeteoService = {
  async getWeather(location, date) {
    try {
      // Geocode the location to get latitude/longitude
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
      const geocodeResponse = await axios.get(geocodeUrl, {
        headers: { 'User-Agent': 'TravelPlannerApp/1.0' },
      });
      if (!geocodeResponse.data[0]) {
        throw new Error('Could not geocode location');
      }
      const { lat, lon } = geocodeResponse.data[0];

      const today = new Date('2025-04-25');
      const inputDate = new Date(date);
      const isFuture = inputDate >= today;

      // Choose API based on date
      const apiUrl = isFuture
        ? 'https://api.open-meteo.com/v1/forecast'
        : 'https://archive-api.open-meteo.com/v1/archive';
      const weatherParams = {
        latitude: lat,
        longitude: lon,
        start_date: date,
        end_date: date,
        hourly: 'temperature_2m,precipitation',
      };

      const weatherResponse = await axios.get(apiUrl, { params: weatherParams });
      if (weatherResponse.status === 200) {
        const hourlyData = weatherResponse.data.hourly;
        return {
          location,
          country: geocodeResponse.data[0].display_name.split(', ').pop() || 'Unknown',
          date,
          hourly: hourlyData.time.map((time, i) => ({
            time,
            hour: new Date(time).toISOString().split('T')[1].slice(0, 5),
            temperature: hourlyData.temperature_2m[i].toString(),
            precipitation: hourlyData.precipitation[i].toString(),
          })),
        };
      } else {
        throw new Error(`Weather API Error: ${weatherResponse.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  },
};

export default openMeteoService;