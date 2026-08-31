// Favorite controller manages the user's saved properties list.
const User = require("../models/User");
const Property = require("../models/Property");
const asyncHandler = require("../utils/asyncHandler");

// Add property to current user's favorites.
const addFavorite = asyncHandler(async (req, res) => {
    const { propertyId } = req.body;

    if (!propertyId) {
        res.status(400);
        throw new Error("propertyId is required");
    }

    const property = await Property.findById(propertyId);
    if (!property) {
        res.status(404);
        throw new Error("Property not found");
    }

    const user = await User.findById(req.user.id);

    const alreadyAdded = user.favorites.some((id) => id.toString() === propertyId);
    if (alreadyAdded) {
        res.status(400);
        throw new Error("Property is already in favorites");
    }

    user.favorites.push(propertyId);
    await user.save();

    res.status(200).json({ message: "Property added to favorites", favorites: user.favorites });
});

// Remove property from current user's favorites.
const removeFavorite = asyncHandler(async (req, res) => {
    const propertyId = req.params.propertyId;
    const user = await User.findById(req.user.id);

    user.favorites = user.favorites.filter((id) => id.toString() !== propertyId);
    await user.save();

    res.status(200).json({ message: "Property removed from favorites", favorites: user.favorites });
});

// Get full favorite properties with vendor summary data.
const getMyFavorites = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).populate({
        path: "favorites",
        populate: { path: "vendor", select: "name email" },
    });

    res.status(200).json({ count: user.favorites.length, favorites: user.favorites });
});

module.exports = {
    addFavorite,
    removeFavorite,
    getMyFavorites,
};
