import Itinerary from '../models/iternary.model.js';
import Trip from '../models/trip.model.js';

// Create a new itinerary
export const createItinerary = async (req, res) => {
  try {
    const { tripId, type, content } = req.body;
    const userId = req.user.id; // From auth middleware

    // Verify the trip belongs to the authenticated user
    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found or you do not have access to this trip'
      });
    }

    // Check if an itinerary of this type already exists for this trip
    const existingItinerary = await Itinerary.findOne({ tripId, type });
    if (existingItinerary) {
      return res.status(400).json({
        success: false,
        message: `A ${type} itinerary already exists for this trip`,
        itinerary: existingItinerary
      });
    }

    // Create new itinerary
    const newItinerary = new Itinerary({
      userId,
      tripId,
      type,
      content
    });

    // Save itinerary to database
    const savedItinerary = await newItinerary.save();

    res.status(201).json({
      success: true,
      message: 'Itinerary created successfully',
      itinerary: savedItinerary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create itinerary',
      error: error.message
    });
  }
};

// Get all itineraries for the authenticated user
export const getItineraries = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { tripId, type } = req.query;

    // Build query object
    const query = { userId };
    
    // Add filters if provided
    if (tripId) query.tripId = tripId;
    if (type) query.type = type;

    // Find all itineraries that match the query
    const itineraries = await Itinerary.find(query)
      .populate('tripId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: itineraries.length,
      itineraries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch itineraries',
      error: error.message
    });
  }
};

// Get a specific itinerary by ID
export const getItinerary = async (req, res) => {
  try {
    const itineraryId = req.params.id;
    const userId = req.user.id; // From auth middleware

    // Find itinerary by ID
    const itinerary = await Itinerary.findById(itineraryId).populate('tripId');

    // Check if itinerary exists
    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Verify itinerary belongs to authenticated user
    if (itinerary.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this itinerary'
      });
    }

    res.status(200).json({
      success: true,
      itinerary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch itinerary',
      error: error.message
    });
  }
};

// Update an itinerary
export const updateItinerary = async (req, res) => {
  try {
    const itineraryId = req.params.id;
    const userId = req.user.id; // From auth middleware
    const { type, content } = req.body;

    // Find itinerary by ID
    const itinerary = await Itinerary.findById(itineraryId);

    // Check if itinerary exists
    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Verify itinerary belongs to authenticated user
    if (itinerary.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this itinerary'
      });
    }

    // If type is being changed, check if an itinerary of the new type already exists
    if (type && type !== itinerary.type) {
      const existingItinerary = await Itinerary.findOne({ 
        tripId: itinerary.tripId, 
        type,
        _id: { $ne: itineraryId }
      });
      
      if (existingItinerary) {
        return res.status(400).json({
          success: false,
          message: `A ${type} itinerary already exists for this trip`,
          itinerary: existingItinerary
        });
      }
    }

    // Update itinerary
    const updatedItinerary = await Itinerary.findByIdAndUpdate(
      itineraryId,
      { 
        type: type || itinerary.type,
        content: content || itinerary.content 
      },
      { new: true, runValidators: true }
    ).populate('tripId');

    res.status(200).json({
      success: true,
      message: 'Itinerary updated successfully',
      itinerary: updatedItinerary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update itinerary',
      error: error.message
    });
  }
};

// Delete an itinerary
export const deleteItinerary = async (req, res) => {
  try {
    const itineraryId = req.params.id;
    const userId = req.user.id; // From auth middleware

    // Find itinerary by ID
    const itinerary = await Itinerary.findById(itineraryId);

    // Check if itinerary exists
    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Verify itinerary belongs to authenticated user
    if (itinerary.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this itinerary'
      });
    }

    // Delete itinerary
    await Itinerary.findByIdAndDelete(itineraryId);

    res.status(200).json({
      success: true,
      message: 'Itinerary deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete itinerary',
      error: error.message
    });
  }
};