// Favorite endpoints for adding, removing, and listing saved properties.
const express = require("express");
const {
    addFavorite,
    removeFavorite,
    getMyFavorites,
} = require("../controllers/favoriteController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, addFavorite);
router.delete("/:propertyId", protect, removeFavorite);
router.get("/", protect, getMyFavorites);

module.exports = router;
