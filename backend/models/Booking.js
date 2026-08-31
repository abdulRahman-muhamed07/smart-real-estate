// Booking schema links a user with a property reservation.
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },
        bookingDate: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "rejected", "cancelled"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate booking documents for the same user-property pair.
bookingSchema.index({ user: 1, property: 1 }, { unique: true });

module.exports = mongoose.model("Booking", bookingSchema);
