import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
import Itinerary from '../models/iternary.model.js';
import Trip from '../models/trip.model.js';
import openMeteoService from '../utils/openMeteo.js';

dotenv.config();

const API_KEY = process.env.MAKCORPS_API_KEY || '680ab6edbb8c7f47168fe62f';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to validate ISO date format (YYYY-MM-DD)
const isValidDate = (dateStr) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};

// Function to fetch mapping data and return the cityid
const fetchMappingData = async (locationName) => {
  try {
    const mappingUrl = 'https://api.makcorps.com/mapping';
    const mappingParams = {
      api_key: API_KEY,
      name: locationName,
    };

    const response = await axios.get(mappingUrl, { params: mappingParams });

    if (response.status === 200) {
      const jsonData = response.data;
      const cityEntry = jsonData.find(
        (entry) => entry.type === 'GEO' && entry.details.placetype === 10009
      );

      if (!cityEntry) {
        throw new Error('No suitable city-level entry found in mapping data');
      }

      return cityEntry.document_id;
    } else {
      throw new Error(`Mapping API Error: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    throw new Error(`Failed to fetch mapping data: ${error.message}`);
  }
};

// Function to fetch city data (hotels) using cityid
const fetchCityData = async (cityid, checkin, checkout) => {
  try {
    const cityUrl = 'https://api.makcorps.com/city';
    const cityParams = {
      cityid,
      pagination: '0',
      cur: 'INR',
      rooms: '1',
      adults: '2',
      checkin,
      checkout,
      api_key: API_KEY,
    };

    const response = await axios.get(cityUrl, { params: cityParams });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`City API Error: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    throw new Error(`Failed to fetch city data: ${error.message}`);
  }
};

// Controller to generate itinerary with hotel and weather data
export const generateItinerary = async (req, res) => {
  try {
    const { destination, startDate, endDate, preferences, type = 'budget', numberOfPeople = 1 } = req.body;

    // Validate inputs
    if (!destination || !startDate || !endDate || !preferences) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: destination, startDate, endDate, or preferences',
      });
    }
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }
    if (!Array.isArray(preferences) || preferences.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Preferences must be a non-empty array',
      });
    }
    if (!['budget', 'luxury'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be "budget" or "luxury"',
      });
    }
    if (!Number.isInteger(numberOfPeople) || numberOfPeople < 1) {
      return res.status(400).json({
        success: false,
        message: 'Number of people must be a positive integer',
      });
    }

    // Validate date range for weather forecast
    const today = new Date('2025-04-25');
    const maxForecastDate = new Date(today);
    maxForecastDate.setDate(today.getDate() + 16); // Open Meteo forecast up to 16 days
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > maxForecastDate || end > maxForecastDate) {
      return res.status(400).json({
        success: false,
        message: `Weather forecast unavailable for dates beyond ${maxForecastDate.toISOString().split('T')[0]}`,
      });
    }

    // Calculate number of days
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Fetch hotel data from MakCorps API
    let hotelNames = [];
    try {
      const cityid = await fetchMappingData(destination);
      const hotelData = await fetchCityData(cityid, startDate, endDate);
      hotelNames = hotelData
        .filter((hotel) => hotel.name && hotel.reviews.rating >= 4.5)
        .map((hotel) => hotel.name)
        .slice(0, 5);
    } catch (error) {
      console.error('Error fetching hotel data:', error.message);
      hotelNames = ['Generic Hotel', 'City Lodge', 'Traveler’s Inn'];
    }

    // Fetch weather data for each day
    let weatherSummaries = [];
    try {
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        const weatherData = await openMeteoService.getWeather(destination, dateStr);
        const avgTemp = weatherData.hourly
          .reduce((sum, h) => sum + parseFloat(h.temperature), 0) / weatherData.hourly.length;
        const totalPrecip = weatherData.hourly
          .reduce((sum, h) => sum + parseFloat(h.precipitation), 0);
        weatherSummaries.push({
          dayNumber: i + 1,
          date: dateStr,
          avgTemperature: Math.round(avgTemp * 10) / 10,
          precipitation: totalPrecip,
          condition: totalPrecip > 0 ? 'Rainy' : avgTemp > 25 ? 'Sunny' : 'Mild',
        });
      }
    } catch (error) {
      console.error('Error fetching weather data:', error.message);
      weatherSummaries = Array.from({ length: days }, (_, i) => {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        return {
          dayNumber: i + 1,
          date: currentDate.toISOString().split('T')[0],
          avgTemperature: 25,
          precipitation: 0,
          condition: 'Mild',
        };
      });
    }

    // Create structured prompt with hotel names and weather data
    const prompt = `
      Create a detailed ${type} travel itinerary for ${destination} for ${days} days from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]} for ${numberOfPeople} people.
      
      Traveler preferences: ${preferences.join(', ')}
      
      Suggested hotels (use these for accommodation suggestions): ${hotelNames.join(', ')}
      
      Weather forecast:
      ${weatherSummaries.map(w => `Day ${w.dayNumber} (${w.date}): Avg Temp ${w.avgTemperature}°C, ${w.condition}, Precipitation ${w.precipitation}mm`).join('\n')}
      
      Format the response as a valid JSON object following EXACTLY this structure:
      {
        "days": [
          {
            "dayNumber": 1,
            "weather": {
              "avgTemperature": 25,
              "precipitation": 0,
              "condition": "Sunny"
            },
            "activities": [
              {
                "time": "09:00",
                "description": "Activity description",
                "cost": 10,
                "costPerPerson": 10,
                "location": "Location name"
              }
            ],
            "accommodation": {
              "name": "One of: ${hotelNames.join(', ')}",
              "cost": 50,
              "costPerPerson": 50,
              "address": "Accommodation address"
            },
            "totalDailyCost": 100,
            "totalDailyCostPerPerson": 100
          }
        ],
        "totalCost": 500,
        "totalCostPerPerson": 500,
        "transportationOptions": [
          {
            "type": "Transportation type",
            "cost": 20,
            "costPerPerson": 20,
            "duration": "Duration info"
          }
        ],
        "summary": "Brief summary of the ${days}-day trip to ${destination} for ${numberOfPeople} people, highlighting key experiences and attractions."
      }
      
      Requirements:
      - For ${type} type, adjust costs appropriately (${type === 'luxury' ? 'high-end experiences' : 'affordable options'})
      - Include 4-6 activities per day with varied morning, afternoon, and evening options
      - Adjust activities based on weather: prefer indoor activities (museums, dining) for rainy days, outdoor activities (beaches, hikes) for sunny/mild days
      - All costs should be in USD as numbers without $ symbol
      - Calculate both total costs for the group (${numberOfPeople} people) and per person costs
      - Be specific with activity descriptions and locations
      - Use the provided hotel names for accommodation suggestions
      - Include a concise trip summary highlighting key experiences
      - Only return the JSON with no additional text
      - Ensure the JSON is valid and properly formatted
    `;

    // Generate content using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response as JSON
    let itineraryContent;
    try {
      const jsonText = text.replace(/```json|```/g, '').trim();
      itineraryContent = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Error parsing Gemini response as JSON:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate valid itinerary format',
        error: parseError.message,
      });
    }

    // Format the final response
    const itineraryData = {
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} itinerary generated successfully for ${destination} (${numberOfPeople} people)`,
      itinerary: {
        type,
        numberOfPeople,
        content: itineraryContent,
      },
    };

    res.status(200).json(itineraryData);
  } catch (error) {
    console.error('Error generating itinerary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate itinerary',
      error: error.message,
    });
  }
};

// Controller to save generated itinerary
export const saveGeneratedItinerary = async (req, res) => {
  try {
    const { tripId, type, content, numberOfPeople } = req.body;
    const userId = req.user._id; // From auth middleware

    // Validate inputs
    if (!tripId || !type || !content || !numberOfPeople) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tripId, type, content, or numberOfPeople',
      });
    }
    if (!['budget', 'luxury'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be "budget" or "luxury"',
      });
    }
    if (!Number.isInteger(numberOfPeople) || numberOfPeople < 1) {
      return res.status(400).json({
        success: false,
        message: 'Number of people must be a positive integer',
      });
    }

    // Verify the trip belongs to the authenticated user
    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found or you do not have access to this trip',
      });
    }

    // Check if an itinerary of this type already exists for this trip
    const existingItinerary = await Itinerary.findOne({ tripId, type });
    if (existingItinerary) {
      return res.status(400).json({
        success: false,
        message: `A ${type} itinerary already exists for this trip`,
        itinerary: existingItinerary,
      });
    }

    // Create new itinerary
    const newItinerary = new Itinerary({
      userId,
      tripId,
      type,
      numberOfPeople,
      content,
    });

    // Save itinerary to database
    const savedItinerary = await newItinerary.save();

    res.status(201).json({
      success: true,
      message: 'Generated itinerary saved successfully',
      itinerary: savedItinerary,
    });
  } catch (error) {
    console.error('Error saving generated itinerary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save generated itinerary',
      error: error.message,
    });
  }
};