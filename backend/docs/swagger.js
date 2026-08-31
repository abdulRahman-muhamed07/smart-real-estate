// Swagger/OpenAPI definition for documenting and testing API endpoints.
const swaggerJSDoc = require("swagger-jsdoc");

// Central OpenAPI configuration consumed by swagger-ui-express.
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Smart Real Estate API",
            version: "1.0.0",
            description: "Backend API documentation for Smart Real Estate platform",
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Local development server",
            },
        ],
        tags: [
            { name: "Auth" },
            { name: "Properties" },
            { name: "Bookings" },
            { name: "Favorites" },
            { name: "Reviews" },
            { name: "Admin" },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "661f1b0f8cb7f117fa5d6a10" },
                        name: { type: "string", example: "Ahmed Ali" },
                        email: { type: "string", example: "ahmed@example.com" },
                        phone: { type: "string", example: "+201001234567" },
                        role: { type: "string", enum: ["user", "vendor", "admin"] },
                    },
                },
                Property: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "661f1b0f8cb7f117fa5d6a20" },
                        title: { type: "string", example: "Modern Apartment in Cairo" },
                        description: { type: "string", example: "3-bedroom apartment close to metro station" },
                        price: { type: "number", example: 450000 },
                        location: { type: "string", example: "Cairo" },
                        area: { type: "number", example: 150 },
                        rooms: { type: "number", example: 3 },
                        bathrooms: { type: "number", example: 2 },
                        type: {
                            type: "string",
                            enum: ["apartment", "villa", "house", "studio", "office", "land", "other"],
                        },
                        listingType: { type: "string", enum: ["sale", "rent"] },
                        nearbyServices: {
                            type: "array",
                            items: { type: "string" },
                            example: ["school", "hospital", "metro"],
                        },
                        status: { type: "string", enum: ["available", "booked", "sold"] },
                        images: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    url: { type: "string" },
                                    publicId: { type: "string" },
                                },
                            },
                        },
                    },
                },
                Booking: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        user: { type: "string" },
                        property: { type: "string" },
                        bookingDate: { type: "string", format: "date-time" },
                        status: { type: "string", enum: ["pending", "confirmed", "cancelled"] },
                    },
                },
                Review: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        user: { type: "string" },
                        property: { type: "string" },
                        rating: { type: "number", minimum: 1, maximum: 5 },
                        comment: { type: "string" },
                    },
                },
            },
        },
        paths: {
            "/api/auth/register": {
                post: {
                    tags: ["Auth"],
                    summary: "Register a new user or vendor",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["name", "email", "password"],
                                    properties: {
                                        name: { type: "string", example: "Ahmed Ali" },
                                        email: { type: "string", example: "ahmed@example.com" },
                                        phone: { type: "string", example: "+201001234567" },
                                        password: { type: "string", example: "SecurePassword123" },
                                        role: { type: "string", enum: ["user", "vendor"], example: "user" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: "Registration successful" },
                        400: { description: "Validation error or email already in use" },
                    },
                },
            },
            "/api/auth/login": {
                post: {
                    tags: ["Auth"],
                    summary: "Login and get JWT token",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["email", "password"],
                                    properties: {
                                        email: { type: "string" },
                                        password: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Login successful" },
                        401: { description: "Invalid credentials" },
                    },
                },
            },
            "/api/properties": {
                get: {
                    tags: ["Properties"],
                    summary: "Get all properties",
                    responses: {
                        200: { description: "Properties list" },
                    },
                },
                post: {
                    tags: ["Properties"],
                    summary: "Add property (vendor/admin)",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    required: [
                                        "title",
                                        "description",
                                        "price",
                                        "location",
                                        "area",
                                        "rooms",
                                        "bathrooms",
                                        "type"
                                    ],
                                    properties: {
                                        title: { type: "string" },
                                        description: { type: "string" },
                                        price: { type: "number" },
                                        location: { type: "string" },
                                        area: { type: "number" },
                                        rooms: { type: "number" },
                                        bathrooms: { type: "number" },
                                        type: {
                                            type: "string",
                                            enum: ["apartment", "villa", "house", "studio", "office", "land", "other"],
                                        },
                                        listingType: { type: "string", enum: ["sale", "rent"] },
                                        nearbyServices: { type: "string", example: "school,hospital,metro" },
                                        status: { type: "string", enum: ["available", "booked", "sold"] },
                                        images: {
                                            type: "array",
                                            items: { type: "string", format: "binary" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: "Property added" },
                        400: { description: "Bad request (invalid image upload or invalid payload)" },
                        401: { description: "Unauthorized" },
                        403: { description: "Forbidden" },
                    },
                },
            },
            "/api/properties/search": {
                get: {
                    tags: ["Properties"],
                    summary: "Search and filter properties",
                    description: "Search properties by name/description and apply multiple filters with pagination and sorting",
                    parameters: [
                        {
                            in: "query",
                            name: "search",
                            schema: { type: "string" },
                            description: "Search in property title and description"
                        },
                        {
                            in: "query",
                            name: "location",
                            schema: { type: "string" },
                            description: "Filter by location"
                        },
                        {
                            in: "query",
                            name: "minPrice",
                            schema: { type: "number" },
                            description: "Minimum price filter"
                        },
                        {
                            in: "query",
                            name: "maxPrice",
                            schema: { type: "number" },
                            description: "Maximum price filter"
                        },
                        {
                            in: "query",
                            name: "minArea",
                            schema: { type: "number" },
                            description: "Minimum area in square meters"
                        },
                        {
                            in: "query",
                            name: "maxArea",
                            schema: { type: "number" },
                            description: "Maximum area in square meters"
                        },
                        {
                            in: "query",
                            name: "rooms",
                            schema: { type: "number" },
                            description: "Minimum number of rooms"
                        },
                        {
                            in: "query",
                            name: "bathrooms",
                            schema: { type: "number" },
                            description: "Minimum number of bathrooms"
                        },
                        {
                            in: "query",
                            name: "type",
                            schema: { type: "string", enum: ["apartment", "villa", "house", "studio", "office", "land", "other"] },
                            description: "Property type"
                        },
                        {
                            in: "query",
                            name: "listingType",
                            schema: { type: "string", enum: ["sale", "rent"] },
                            description: "Listing type"
                        },
                        {
                            in: "query",
                            name: "status",
                            schema: { type: "string", enum: ["available", "booked", "sold"] },
                            description: "Property status"
                        },
                        {
                            in: "query",
                            name: "nearbyService",
                            schema: { type: "string" },
                            description: "Nearby services filter"
                        },
                        {
                            in: "query",
                            name: "sortBy",
                            schema: { type: "string", enum: ["createdAt", "price", "area"], default: "createdAt" },
                            description: "Field to sort by"
                        },
                        {
                            in: "query",
                            name: "sortOrder",
                            schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
                            description: "Sort order (asc for ascending, desc for descending)"
                        },
                        {
                            in: "query",
                            name: "page",
                            schema: { type: "number", default: 1 },
                            description: "Page number for pagination"
                        },
                        {
                            in: "query",
                            name: "limit",
                            schema: { type: "number", default: 10 },
                            description: "Number of results per page"
                        },
                    ],
                    responses: {
                        200: {
                            description: "Search results with pagination",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            count: { type: "number", description: "Number of results in current page" },
                                            total: { type: "number", description: "Total number of matching results" },
                                            page: { type: "number", description: "Current page number" },
                                            pages: { type: "number", description: "Total number of pages" },
                                            properties: {
                                                type: "array",
                                                items: { $ref: "#/components/schemas/Property" }
                                            },
                                        }
                                    }
                                }
                            }
                        },
                    },
                },
            },
            "/api/properties/{id}": {
                get: {
                    tags: ["Properties"],
                    summary: "Get property by ID",
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    responses: {
                        200: { description: "Property details" },
                        404: { description: "Not found" },
                    },
                },
                put: {
                    tags: ["Properties"],
                    summary: "Update property (owner vendor/admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    requestBody: {
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        title: { type: "string" },
                                        description: { type: "string" },
                                        price: { type: "number" },
                                        location: { type: "string" },
                                        area: { type: "number" },
                                        rooms: { type: "number" },
                                        bathrooms: { type: "number" },
                                        type: {
                                            type: "string",
                                            enum: ["apartment", "villa", "house", "studio", "office", "land", "other"],
                                        },
                                        listingType: { type: "string", enum: ["sale", "rent"] },
                                        nearbyServices: { type: "string" },
                                        status: { type: "string", enum: ["available", "booked", "sold"] },
                                        images: {
                                            type: "array",
                                            items: { type: "string", format: "binary" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Property updated" },
                        400: { description: "Bad request (invalid image upload or invalid payload)" },
                        403: { description: "Forbidden" },
                    },
                },
                delete: {
                    tags: ["Properties"],
                    summary: "Delete property (owner vendor/admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    responses: {
                        200: { description: "Property deleted" },
                        403: { description: "Forbidden" },
                    },
                },
            },
            "/api/bookings": {
                post: {
                    tags: ["Bookings"],
                    summary: "Book a property",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["propertyId"],
                                    properties: {
                                        propertyId: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: "Booked successfully" },
                    },
                },
            },
            "/api/bookings/{id}/cancel": {
                patch: {
                    tags: ["Bookings"],
                    summary: "Cancel booking",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    responses: {
                        200: { description: "Cancelled successfully" },
                    },
                },
            },
            "/api/bookings/my-bookings": {
                get: {
                    tags: ["Bookings"],
                    summary: "Get current user bookings",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: "User bookings" },
                    },
                },
            },
            "/api/bookings/vendor/all": {
                get: {
                    tags: ["Bookings"],
                    summary: "Get all bookings for vendor's properties",
                    description: "Get bookings on all properties owned by the vendor with optional filtering and sorting",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "query",
                            name: "status",
                            schema: { type: "string", enum: ["pending", "confirmed", "rejected", "cancelled"] },
                            description: "Filter by booking status",
                        },
                        {
                            in: "query",
                            name: "sortBy",
                            schema: { type: "string", enum: ["createdAt", "status", "user"], default: "createdAt" },
                            description: "Sort field",
                        },
                    ],
                    responses: {
                        200: { description: "Vendor bookings list" },
                        401: { description: "Unauthorized" },
                        403: { description: "Forbidden - Must be vendor" },
                    },
                },
            },
            "/api/bookings/{id}/confirm": {
                patch: {
                    tags: ["Bookings"],
                    summary: "Confirm booking (vendor accepts)",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    responses: {
                        200: { description: "Booking confirmed successfully" },
                        400: { description: "Invalid booking status or bad request" },
                        403: { description: "Not authorized - must be property vendor" },
                        404: { description: "Booking not found" },
                    },
                },
            },
            "/api/bookings/{id}/reject": {
                patch: {
                    tags: ["Bookings"],
                    summary: "Reject booking (vendor declines)",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    requestBody: {
                        required: false,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        reason: { type: "string", description: "Reason for rejection" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Booking rejected successfully" },
                        400: { description: "Invalid booking status or bad request" },
                        403: { description: "Not authorized - must be property vendor" },
                        404: { description: "Booking not found" },
                    },
                },
            },
            "/api/favorites": {
                get: {
                    tags: ["Favorites"],
                    summary: "Get my favorite properties",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: "Favorites list" },
                    },
                },
                post: {
                    tags: ["Favorites"],
                    summary: "Add favorite",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["propertyId"],
                                    properties: {
                                        propertyId: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Added to favorites" },
                    },
                },
            },
            "/api/favorites/{propertyId}": {
                delete: {
                    tags: ["Favorites"],
                    summary: "Remove favorite",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "propertyId", required: true, schema: { type: "string" } }],
                    responses: {
                        200: { description: "Removed from favorites" },
                    },
                },
            },
            "/api/reviews": {
                post: {
                    tags: ["Reviews"],
                    summary: "Add review",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["propertyId", "rating", "comment"],
                                    properties: {
                                        propertyId: { type: "string" },
                                        rating: { type: "number", minimum: 1, maximum: 5 },
                                        comment: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: "Review added successfully" },
                        400: { description: "Validation error or duplicate review" },
                        404: { description: "Property not found" },
                    },
                },
            },
            "/api/reviews/property/{propertyId}": {
                get: {
                    tags: ["Reviews"],
                    summary: "Get all reviews for a property",
                    parameters: [
                        {
                            in: "path",
                            name: "propertyId",
                            required: true,
                            schema: { type: "string" },
                            description: "Property ID",
                        },
                    ],
                    responses: {
                        200: { description: "Reviews retrieved successfully" },
                        404: { description: "Property not found" },
                    },
                },
            },
            "/api/reviews/my-reviews": {
                get: {
                    tags: ["Reviews"],
                    summary: "Get current user's reviews",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: "User reviews retrieved successfully" },
                        401: { description: "Unauthorized" },
                    },
                },
            },
            "/api/reviews/{reviewId}": {
                put: {
                    tags: ["Reviews"],
                    summary: "Update a review",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "reviewId",
                            required: true,
                            schema: { type: "string" },
                            description: "Review ID",
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        rating: { type: "number", minimum: 1, maximum: 5 },
                                        comment: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Review updated successfully" },
                        403: { description: "Not authorized to update this review" },
                        404: { description: "Review not found" },
                    },
                },
                delete: {
                    tags: ["Reviews"],
                    summary: "Delete a review",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "reviewId",
                            required: true,
                            schema: { type: "string" },
                            description: "Review ID",
                        },
                    ],
                    responses: {
                        200: { description: "Review deleted successfully" },
                        403: { description: "Not authorized to delete this review" },
                        404: { description: "Review not found" },
                    },
                },
            },
            "/api/admin/users": {
                get: {
                    tags: ["Admin"],
                    summary: "Get all users",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: "Users list" },
                    },
                },
            },
            "/api/admin/users/{id}": {
                delete: {
                    tags: ["Admin"],
                    summary: "Delete user",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    responses: {
                        200: { description: "User deleted" },
                    },
                },
            },
            "/api/admin/dashboard": {
                get: {
                    tags: ["Admin"],
                    summary: "Get dashboard statistics",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: "Stats response" },
                    },
                },
            },
            "/api/admin/properties": {
                get: {
                    tags: ["Admin"],
                    summary: "Get all properties (admin)",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: "Properties list" },
                    },
                },
            },
            "/api/admin/properties/{id}": {
                delete: {
                    tags: ["Admin"],
                    summary: "Delete any property (admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    responses: {
                        200: { description: "Property deleted" },
                    },
                },
            },
        },
    },
    apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
