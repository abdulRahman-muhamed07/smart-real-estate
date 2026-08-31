// Admin controller exposes platform-wide management operations.
const User = require("../models/User");
const Property = require("../models/Property");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const cloudinary = require("../config/cloudinary");
const asyncHandler = require("../utils/asyncHandler");

// List all users except hidden password field.
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ count: users.length, users });
});

// Delete user with a guard that prevents removing the last admin account.
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    if (user.role === "admin") {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount <= 1) {
            res.status(400);
            throw new Error("Cannot delete the last admin account");
        }
    }

    await User.deleteOne({ _id: user._id });

    res.status(200).json({ message: "User deleted successfully" });
});

// Aggregate dashboard metrics in parallel for faster response.
const getDashboardStats = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalVendors,
        totalProperties,
        availableProperties,
        bookedProperties,
        soldProperties,
        totalBookings,
        pendingBookings,
        totalReviews,
    ] = await Promise.all([
        User.countDocuments({ role: "user" }),
        User.countDocuments({ role: "vendor" }),
        Property.countDocuments(),
        Property.countDocuments({ status: "available" }),
        Property.countDocuments({ status: "booked" }),
        Property.countDocuments({ status: "sold" }),
        Booking.countDocuments(),
        Booking.countDocuments({ status: "pending" }),
        Review.countDocuments(),
    ]);

    res.status(200).json({
        users: {
            total: totalUsers,
            vendors: totalVendors,
        },
        properties: {
            total: totalProperties,
            available: availableProperties,
            booked: bookedProperties,
            sold: soldProperties,
        },
        bookings: {
            total: totalBookings,
            pending: pendingBookings,
        },
        reviews: {
            total: totalReviews,
        },
    });
});

// Admin view of all properties with owner information.
const getAllPropertiesAdmin = asyncHandler(async (req, res) => {
    const properties = await Property.find().populate("vendor", "name email role").sort({ createdAt: -1 });

    res.status(200).json({ count: properties.length, properties });
});

// Fully remove property and its related resources.
const deletePropertyAdmin = asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id);

    if (!property) {
        res.status(404);
        throw new Error("Property not found");
    }

    if (property.images && property.images.length > 0) {
        // Best-effort image cleanup in Cloudinary.
        await Promise.all(
            property.images.map((image) => cloudinary.uploader.destroy(image.publicId).catch(() => null))
        );
    }

    await Booking.deleteMany({ property: property._id });
    await Review.deleteMany({ property: property._id });
    await property.deleteOne();

    res.status(200).json({ message: "Property deleted successfully by admin" });
});

module.exports = {
    getAllUsers,
    deleteUser,
    getDashboardStats,
    getAllPropertiesAdmin,
    deletePropertyAdmin,
};
