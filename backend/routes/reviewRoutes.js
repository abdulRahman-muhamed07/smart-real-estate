// Review endpoint for authenticated users.
const express = require("express");
const { addReview, getPropertyReviews, getMyReviews, updateReview, deleteReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a review
router.post("/", protect, addReview);

// Get reviews for a specific property
router.get("/property/:propertyId", getPropertyReviews);

// Get current user's reviews
router.get("/my-reviews", protect, getMyReviews);

// Update a review
router.put("/:reviewId", protect, updateReview);

// Delete a review
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;
