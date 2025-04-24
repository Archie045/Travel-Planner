import ItineraryLike from '../models/iternaryLikes.model.js';
import User from '../models/user.model.js';

// Create a new itinerary like
export const createItineraryLike = async (req, res) => {
  try {
    const { itineraryId, dayNumber, liked } = req.body;
    const userId = req.user.id; // From auth middleware

    // Check if like already exists for this user and itinerary
    const existingLike = await ItineraryLike.findOne({ 
      userId,
      itineraryId,
      dayNumber
    });

    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: 'You have already liked/disliked this itinerary day',
        itineraryLike: existingLike
      });
    }

    // Create new itinerary like
    const newItineraryLike = new ItineraryLike({
      userId,
      itineraryId,
      dayNumber,
      liked
    });

    // Save to database
    const savedItineraryLike = await newItineraryLike.save();

    // Update user's itineraryLikes array
    await User.findByIdAndUpdate(
      userId,
      { $push: { itineraryLikes: savedItineraryLike._id } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Itinerary like created successfully',
      itineraryLike: savedItineraryLike
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create itinerary like',
      error: error.message
    });
  }
};

// Get all itinerary likes for the authenticated user
export const getItineraryLikes = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { itineraryId } = req.query;

    // Build query object
    const query = { userId };
    
    // Add itineraryId to query if provided
    if (itineraryId) {
      query.itineraryId = itineraryId;
    }

    // Find all itinerary likes for this user with optional filter
    const itineraryLikes = await ItineraryLike.find(query)
      .populate('itineraryId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: itineraryLikes.length,
      itineraryLikes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch itinerary likes',
      error: error.message
    });
  }
};

// Update an itinerary like
export const updateItineraryLike = async (req, res) => {
  try {
    const likeId = req.params.id;
    const userId = req.user.id; // From auth middleware
    const { liked } = req.body;

    // Find itinerary like by ID
    const itineraryLike = await ItineraryLike.findById(likeId);

    // Check if itinerary like exists
    if (!itineraryLike) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary like not found'
      });
    }

    // Verify itinerary like belongs to authenticated user
    if (itineraryLike.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this itinerary like'
      });
    }

    // Update itinerary like
    const updatedItineraryLike = await ItineraryLike.findByIdAndUpdate(
      likeId,
      { liked },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Itinerary like updated successfully',
      itineraryLike: updatedItineraryLike
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update itinerary like',
      error: error.message
    });
  }
};

// Delete an itinerary like
export const deleteItineraryLike = async (req, res) => {
  try {
    const likeId = req.params.id;
    const userId = req.user.id; // From auth middleware

    // Find itinerary like by ID
    const itineraryLike = await ItineraryLike.findById(likeId);

    // Check if itinerary like exists
    if (!itineraryLike) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary like not found'
      });
    }

    // Verify itinerary like belongs to authenticated user
    if (itineraryLike.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this itinerary like'
      });
    }

    // Delete itinerary like
    await ItineraryLike.findByIdAndDelete(likeId);

    // Remove itinerary like from user's itineraryLikes array
    await User.findByIdAndUpdate(
      userId,
      { $pull: { itineraryLikes: likeId } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Itinerary like deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete itinerary like',
      error: error.message
    });
  }
};