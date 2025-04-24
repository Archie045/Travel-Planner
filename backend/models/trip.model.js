import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    destination: String,
    startDate: Date,
    endDate: Date,
    review: String,
  },
  { timestamps: true }
);

export default mongoose.model('Trip', tripSchema);