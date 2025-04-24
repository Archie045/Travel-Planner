import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import userRoutes from './routes/user.routes.js';
import tripRoutes from './routes/trip.route.js';
import itineraryRoutes from './routes/itinary.routes.js';
import itineraryLikeRoutes from './routes/itinaryLikes.routes.js';
import airoutes from './routes/ai.routes.js';


// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/itinerary-likes', itineraryLikeRoutes);
app.use('/api/ai',airoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));