import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    type: String, // 'budget' or 'luxury'
    content: Object,
  },
  { timestamps: true }
);

export default mongoose.model('Itinerary', itinerarySchema);