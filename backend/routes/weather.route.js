import { Router } from 'express';
import openMeteoService from '../utils/openMeteo.js';

const router = Router();

router.post('/historical', async (req, res) => {
  const { location, date } = req.body;

  // Validate inputs
  if (!location || !date) {
    return res.status(400).json({ error: 'Location and date are required' });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    const weatherData = await openMeteoService.getHistoricalWeather(location, date);
    res.status(200).json(weatherData);
  } catch (error) {
    console.error('Error in weather route:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;