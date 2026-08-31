// Property controller handles listing CRUD and search workflows.
const Property = require("../models/Property");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const cloudinary = require("../config/cloudinary");
const asyncHandler = require("../utils/asyncHandler");

// Build MongoDB query object from optional filters in request query string.
const buildSearchQuery = (queryParams) => {
    const {
        search,
        location,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
        rooms,
        bathrooms,
        type,
        listingType,
        status,
        nearbyService,
    } = queryParams;

    const query = {};

    // Search by property title or description (case-insensitive).
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    if (location) query.location = { $regex: location, $options: "i" };
    if (type) query.type = type;
    if (listingType) query.listingType = listingType;
    if (status) query.status = status;

    if (rooms) query.rooms = { $gte: Number(rooms) };
    if (bathrooms) query.bathrooms = { $gte: Number(bathrooms) };

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (minArea || maxArea) {
        query.area = {};
        if (minArea) query.area.$gte = Number(minArea);
        if (maxArea) query.area.$lte = Number(maxArea);
    }

    if (nearbyService) {
        query.nearbyServices = { $in: [new RegExp(nearbyService, "i")] };
    }

    return query;
};

// Create a property with optional images and normalized nearby services list.
const addProperty = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        price,
        location,
        area,
        rooms,
        bathrooms,
        type,
        listingType,
        nearbyServices,
        status,
    } = req.body;

    if (!title || !description || !price || !location || !area || !rooms || !bathrooms || !type) {
        res.status(400);
        throw new Error("Missing required property fields");
    }

    // CloudinaryStorage exposes uploaded file URL and public identifier.
    const images = (req.files || []).map((file) => ({
        url: file.path,
        publicId: file.filename,
    }));

    const property = await Property.create({
        title,
        description,
        price,
        location,
        area,
        rooms,
        bathrooms,
        type,
        listingType: listingType || "sale",
        nearbyServices: nearbyServices
            ? Array.isArray(nearbyServices)
                ? nearbyServices
                : String(nearbyServices)
                    .split(",")
                    .map((service) => service.trim())
                    .filter(Boolean)
            : [],
        images,
        status: status || "available",
        vendor: req.user.id,
    });

    res.status(201).json({ message: "Property added successfully", property });
});

// Return all properties for public browsing.
const getAllProperties = asyncHandler(async (req, res) => {
    const properties = await Property.find()
        .populate("vendor", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({ count: properties.length, properties });
});

// Return property details plus its reviews and rating summary.
const getPropertyById = asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id).populate("vendor", "name email");

    if (!property) {
        res.status(404);
        throw new Error("Property not found");
    }

    const reviews = await Review.find({ property: property._id })
        .populate("user", "name")
        .sort({ createdAt: -1 });

    res.status(200).json({
        property,
        reviews,
        reviewCount: reviews.length,
        averageRating:
            reviews.length > 0
                ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
                : 0,
    });
});

// Search properties with filters, pagination, and dynamic sorting.
const searchProperties = asyncHandler(async (req, res) => {
    const query = buildSearchQuery(req.query);

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const properties = await Property.find(query)
        .populate("vendor", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit);

    const totalCount = await Property.countDocuments(query);

    res.status(200).json({
        count: properties.length,
        total: totalCount,
        page,
        pages: Math.ceil(totalCount / limit),
        properties,
    });
});

// Update property data and optionally replace old images with new uploads.
const updateProperty = asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id);

    if (!property) {
        res.status(404);
        throw new Error("Property not found");
    }

    if (req.user.role !== "admin" && property.vendor.toString() !== req.user.id) {
        res.status(403);
        throw new Error("You can only update your own properties");
    }

    if (req.files && req.files.length > 0) {
        if (property.images && property.images.length > 0) {
            // Remove old images from Cloudinary before saving replacements.
            await Promise.all(
                property.images.map((image) =>
                    cloudinary.uploader.destroy(image.publicId).catch(() => null)
                )
            );
        }

        property.images = req.files.map((file) => ({
            url: file.path,
            publicId: file.filename,
        }));
    }

    // Whitelist fields that can be changed through this endpoint.
    const updatableFields = [
        "title",
        "description",
        "price",
        "location",
        "area",
        "rooms",
        "bathrooms",
        "type",
        "listingType",
        "status",
    ];

    updatableFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            property[field] = req.body[field];
        }
    });

    if (req.body.nearbyServices !== undefined) {
        property.nearbyServices = Array.isArray(req.body.nearbyServices)
            ? req.body.nearbyServices
            : String(req.body.nearbyServices)
                .split(",")
                .map((service) => service.trim())
                .filter(Boolean);
    }

    const updatedProperty = await property.save();

    res.status(200).json({ message: "Property updated successfully", property: updatedProperty });
});

// Delete property and clean up related bookings, reviews, and media.
const deleteProperty = asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id);

    if (!property) {
        res.status(404);
        throw new Error("Property not found");
    }

    if (req.user.role !== "admin" && property.vendor.toString() !== req.user.id) {
        res.status(403);
        throw new Error("You can only delete your own properties");
    }

    if (property.images && property.images.length > 0) {
        await Promise.all(
            property.images.map((image) => cloudinary.uploader.destroy(image.publicId).catch(() => null))
        );
    }

    await Booking.deleteMany({ property: property._id });
    await Review.deleteMany({ property: property._id });
    await property.deleteOne();

    res.status(200).json({ message: "Property deleted successfully" });
});

// Return bookings for properties owned by the logged-in vendor.
const getVendorBookings = asyncHandler(async (req, res) => {
    const vendorProperties = await Property.find({ vendor: req.user.id }).select("_id");
    const propertyIds = vendorProperties.map((p) => p._id);

    const bookings = await Booking.find({ property: { $in: propertyIds } })
        .populate("user", "name email")
        .populate("property", "title location price")
        .sort({ createdAt: -1 });

    res.status(200).json({ count: bookings.length, bookings });
});

module.exports = {
    addProperty,
    getAllProperties,
    getPropertyById,
    searchProperties,
    updateProperty,
    deleteProperty,
    getVendorBookings,
};
