// Admin-only endpoints for user/property management and dashboard data.
const express = require("express");
const {
    getAllUsers,
    deleteUser,
    getDashboardStats,
    getAllPropertiesAdmin,
    deletePropertyAdmin,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.get("/dashboard", getDashboardStats);
router.get("/properties", getAllPropertiesAdmin);
router.delete("/properties/:id", deletePropertyAdmin);

module.exports = router;
