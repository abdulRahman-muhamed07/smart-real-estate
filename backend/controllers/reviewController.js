// Review controller handles creating user reviews for properties.
const Review = require("../models/Review");
const Property = require("../models/Property");
const asyncHandler = require("../utils/asyncHandler");

// Add a review while ensuring one review per user per property.
const addReview = asyncHandler(async (req, res) => {
    const { propertyId, rating, comment } = req.body;

    if (!propertyId || !rating || !comment) {
        res.status(400);
        throw new Error("propertyId, rating and comment are required");
    }

    const property = await Property.findById(propertyId);
    if (!property) {
        res.status(404);
        throw new Error("Property not found");
    }

    const existingReview = await Review.findOne({ user: req.user.id, property: propertyId });
    if (existingReview) {
        res.status(400);
        throw new Error("You already reviewed this property");
    }

    const review = await Review.create({
        user: req.user.id,
        property: propertyId,
        rating,
        comment,
    });

    res.status(201).json({ message: "Review added successfully", review });
});

// Get all reviews for a specific property
const getPropertyReviews = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) {
        res.status(404);
        throw new Error("Property not found");
    }

    const reviews = await Review.find({ property: propertyId }).populate("user", "name avatar");

    res.status(200).json({ message: "Reviews retrieved successfully", reviews });
});

// Get all reviews by the current user
const getMyReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ user: req.user.id }).populate("property", "title images price");

    res.status(200).json({ message: "Your reviews retrieved successfully", reviews });
});

// Update a review
const updateReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
        res.status(404);
        throw new Error("Review not found");
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user.id) {
        res.status(403);
        throw new Error("Not authorized to update this review");
    }

    // Update fields if provided
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();

    res.status(200).json({ message: "Review updated successfully", review });
});

// Delete a review
const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
        res.status(404);
        throw new Error("Review not found");
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user.id) {
        res.status(403);
        throw new Error("Not authorized to delete this review");
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({ message: "Review deleted successfully" });
});

module.exports = {
    addReview,
    getPropertyReviews,
    getMyReviews,
    updateReview,
    deleteReview,
};
