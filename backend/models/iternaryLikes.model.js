import mongoose from 'mongoose';

const itineraryLikeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    itineraryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary' },
    dayNumber: Number,
    liked: Boolean,
  },
  { timestamps: true }
);

export default mongoose.model('ItineraryLike', itineraryLikeSchema);