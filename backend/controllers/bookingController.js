// Booking controller handles reserve/cancel/list booking operations.
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const asyncHandler = require("../utils/asyncHandler");

// Create a booking for an available property.
const bookProperty = asyncHandler(async (req, res) => {
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

    if (property.status !== "available") {
        res.status(400);
        throw new Error("Property is not available for booking");
    }

    // Prevent duplicate active bookings by the same user for the same property.
    const existingBooking = await Booking.findOne({
        user: req.user.id,
        property: propertyId,
        status: { $in: ["pending", "confirmed"] },
    });

    if (existingBooking) {
        res.status(400);
        throw new Error("You already booked this property");
    }

    const booking = await Booking.create({
        user: req.user.id,
        property: propertyId,
        status: "pending",
    });

    // Sync property status once booking is created.
    property.status = "booked";
    await property.save();

    res.status(201).json({ message: "Property booked successfully", booking });
});

// Cancel booking if requester is owner, admin, or property owner vendor.
const cancelBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate("property");

    if (!booking) {
        res.status(404);
        throw new Error("Booking not found");
    }

    const isOwner = booking.user.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    const isVendorOwner =
        req.user.role === "vendor" && booking.property.vendor.toString() === req.user.id;

    if (!isOwner && !isAdmin && !isVendorOwner) {
        res.status(403);
        throw new Error("You are not allowed to cancel this booking");
    }

    booking.status = "cancelled";
    await booking.save();

    // Re-open property for booking when its active booking is cancelled.
    const property = await Property.findById(booking.property._id);
    if (property && property.status === "booked") {
        property.status = "available";
        await property.save();
    }

    res.status(200).json({ message: "Booking cancelled successfully", booking });
});

// Return bookings created by the currently authenticated user.
const getMyBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user.id })
        .populate({
            path: "property",
            select: "title price location status images vendor",
            populate: {
                path: "vendor",
                select: "name email phone avatar"
            }
        })
        .sort({ createdAt: -1 });

    res.status(200).json({ count: bookings.length, bookings });
});

// Get all bookings for properties owned by the vendor
const getVendorBookings = asyncHandler(async (req, res) => {
    const { status, sortBy } = req.query;

    // Find all properties owned by this vendor
    const properties = await Property.find({ vendor: req.user.id }).select("_id");
    const propertyIds = properties.map(p => p._id);

    if (propertyIds.length === 0) {
        return res.status(200).json({ message: "No properties found", bookings: [] });
    }

    // Build filter
    const filter = { property: { $in: propertyIds } };
    if (status) {
        filter.status = status;
    }

    // Sort options
    let sortObj = { createdAt: -1 };
    if (sortBy === "status") {
        sortObj = { status: 1 };
    } else if (sortBy === "user") {
        sortObj = { user: 1 };
    }

    const bookings = await Booking.find(filter)
        .populate("user", "name email phone")
        .populate("property", "title location price images")
        .sort(sortObj);

    res.status(200).json({ count: bookings.length, bookings });
});

// Confirm a booking (vendor accepts the booking)
const confirmBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate("property");

    if (!booking) {
        res.status(404);
        throw new Error("Booking not found");
    }

    // Check if requester is the vendor who owns this property
    if (booking.property.vendor.toString() !== req.user.id) {
        res.status(403);
        throw new Error("You are not authorized to confirm this booking");
    }

    if (booking.status !== "pending") {
        res.status(400);
        throw new Error(`Cannot confirm a booking with status: ${booking.status}`);
    }

    booking.status = "confirmed";
    await booking.save();

    res.status(200).json({ message: "Booking confirmed successfully", booking });
});

// Reject a booking (vendor declines the booking)
const rejectBooking = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id).populate("property");

    if (!booking) {
        res.status(404);
        throw new Error("Booking not found");
    }

    // Check if requester is the vendor who owns this property
    if (booking.property.vendor.toString() !== req.user.id) {
        res.status(403);
        throw new Error("You are not authorized to reject this booking");
    }

    if (booking.status !== "pending") {
        res.status(400);
        throw new Error(`Cannot reject a booking with status: ${booking.status}`);
    }

    booking.status = "rejected";
    if (reason) {
        booking.rejectionReason = reason;
    }
    await booking.save();

    // Re-open property for booking when booking is rejected
    const property = await Property.findById(booking.property._id);
    if (property && property.status === "booked") {
        property.status = "available";
        await property.save();
    }

    res.status(200).json({ message: "Booking rejected successfully", booking });
});

module.exports = {
    bookProperty,
    cancelBooking,
    getMyBookings,
    getVendorBookings,
    confirmBooking,
    rejectBooking,
};
