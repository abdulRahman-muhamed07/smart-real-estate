// Property endpoints for public browsing and vendor/admin management.
const express = require("express");
const {
    addProperty,
    getAllProperties,
    getPropertyById,
    searchProperties,
    updateProperty,
    deleteProperty,
    getVendorBookings,
} = require("../controllers/propertyController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { uploadPropertyImages } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getAllProperties);
router.get("/search", searchProperties);
router.get("/vendor/bookings", protect, authorize("vendor"), getVendorBookings);
router.get("/:id", getPropertyById);

router.post(
    "/",
    protect,
    authorize("vendor", "admin"),
    uploadPropertyImages,
    addProperty
);

router.put(
    "/:id",
    protect,
    authorize("vendor", "admin"),
    uploadPropertyImages,
    updateProperty
);

router.delete("/:id", protect, authorize("vendor", "admin"), deleteProperty);

module.exports = router;
