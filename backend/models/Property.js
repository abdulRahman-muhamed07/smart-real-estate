// Property schema represents a listed real-estate unit.
const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 3000,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        location: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        area: {
            type: Number,
            required: true,
            min: 0,
        },
        rooms: {
            type: Number,
            required: true,
            min: 0,
        },
        bathrooms: {
            type: Number,
            required: true,
            min: 0,
        },
        type: {
            type: String,
            required: true,
            enum: ["apartment", "villa", "house", "studio", "office", "land", "other"],
        },
        listingType: {
            type: String,
            required: true,
            enum: ["sale", "rent"],
            default: "sale",
        },
        nearbyServices: [
            {
                type: String,
                trim: true,
            },
        ],
        images: [
            {
                url: {
                    type: String,
                    required: true,
                },
                publicId: {
                    type: String,
                    required: true,
                },
            },
        ],
        status: {
            type: String,
            enum: ["available", "booked", "sold"],
            default: "available",
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Property", propertySchema);
