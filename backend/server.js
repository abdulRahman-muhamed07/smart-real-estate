// Initialize app dependencies and shared configuration.
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const connectDB = require("./config/db");
const swaggerSpec = require("./docs/swagger");

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

require("./config/cloudinary");
connectDB();

const app = express();

// Global middleware for CORS and body parsing.
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.status(200).json({ message: "Smart Real Estate API is running" });
});

// Expose API documentation.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Register feature routes.
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/property", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

// Start HTTP server.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
