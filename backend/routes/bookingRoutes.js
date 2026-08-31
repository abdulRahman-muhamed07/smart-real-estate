// Booking endpoints for create/cancel/list flows.
const express = require("express");
const {
    bookProperty,
    cancelBooking,
    getMyBookings,
    getVendorBookings,
    confirmBooking,
    rejectBooking,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// User bookings
router.post("/", protect, bookProperty);
router.patch("/:id/cancel", protect, cancelBooking);
router.get("/my-bookings", protect, getMyBookings);

// Vendor bookings management
router.get("/vendor/all", protect, authorize("vendor"), getVendorBookings);
router.patch("/:id/confirm", protect, authorize("vendor"), confirmBooking);
router.patch("/:id/reject", protect, authorize("vendor"), rejectBooking);

module.exports = router;
