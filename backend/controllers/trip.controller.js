import Trip from '../models/trip.model.js';
import User from '../models/user.model.js';

// Create a new trip
export const createTrip = async (req, res) => {
  try {
    const { destination, startDate, endDate, review } = req.body;
    const userId = req.user.id; // From auth middleware

    // Create new trip
    const newTrip = new Trip({
      userId,
      destination,
      startDate,
      endDate,
      review,
    });

    // Save trip to database
    const savedTrip = await newTrip.save();

    // Update user's trips array
    await User.findByIdAndUpdate(
      userId,
      { $push: { trips: savedTrip._id } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      trip: savedTrip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create trip',
      error: error.message,
    });
  }
};

// Get all trips for the authenticated user
export const getTrips = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    // Find all trips for this user
    const trips = await Trip.find({ userId }).sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips',
      error: error.message,
    });
  }
};

// Get a specific trip by ID
export const getTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id; // From auth middleware

    // Find trip by ID
    const trip = await Trip.findById(tripId);

    // Check if trip exists
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Verify trip belongs to authenticated user
    if (trip.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this trip',
      });
    }

    res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip',
      error: error.message,
    });
  }
};

// Update a trip
export const updateTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id; // From auth middleware
    const { destination, startDate, endDate, review } = req.body;

    // Find trip by ID
    const trip = await Trip.findById(tripId);

    // Check if trip exists
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Verify trip belongs to authenticated user
    if (trip.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this trip',
      });
    }

    // Update trip
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      { 
        destination, 
        startDate, 
        endDate, 
        review 
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Trip updated successfully',
      trip: updatedTrip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update trip',
      error: error.message,
    });
  }
};

// Delete a trip
export const deleteTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id; // From auth middleware

    // Find trip by ID
    const trip = await Trip.findById(tripId);

    // Check if trip exists
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Verify trip belongs to authenticated user
    if (trip.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this trip',
      });
    }

    // Delete trip
    await Trip.findByIdAndDelete(tripId);

    // Remove trip from user's trips array
    await User.findByIdAndUpdate(
      userId,
      { $pull: { trips: tripId } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete trip',
      error: error.message,
    });
  }
};