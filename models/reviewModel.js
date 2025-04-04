import mongoose from "mongoose";

// review schema
const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "doctor",
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "appointment",
    required: true,
    unique: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update doctor rating when review is saved or removed
reviewSchema.post("save", async function(doc) {
  await doc.constructor.calculateAverageRating(doc.doctor);
});

reviewSchema.post("remove", async function(doc) {
  await doc.constructor.calculateAverageRating(doc.doctor);
});

// Static method to calculate average rating
reviewSchema.statics.calculateAverageRating = async function(doctorId) {
  const stats = await this.aggregate([
    { $match: { doctor: doctorId } },
    { $group: {
      _id: "$doctor",
      averageRating: { $avg: "$rating" },
      totalReviews: { $sum: 1 }
    }}
  ]);

  await mongoose.model("doctor").findByIdAndUpdate(doctorId, {
    averageRating: stats[0]?.averageRating || 0,
    ratingCount: stats[0]?.totalReviews || 0
  });
};

// review model
const reviewModel = mongoose.models.review || mongoose.model("review", reviewSchema);

export default reviewModel;