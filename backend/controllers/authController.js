// Auth controller handles user registration and login flows.
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

// Register a new account and return a signed JWT.
const register = asyncHandler(async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Name, email, and password are required");
    }

    // Prevent public registration as admin.
    const allowedRoles = ["user", "vendor"];
    const selectedRole = role && allowedRoles.includes(role) ? role : "user";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        res.status(400);
        throw new Error("Email is already in use");
    }

    const user = await User.create({
        name,
        email,
        phone,
        password,
        role: selectedRole,
    });

    const token = generateToken({ id: user._id, role: user.role });

    res.status(201).json({
        message: "Registration successful",
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
        },
    });
});

// Validate credentials and issue a fresh JWT for authenticated access.
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("Email and password are required");
    }

    // Password is select:false in schema, so we explicitly include it here.
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
        res.status(401);
        throw new Error("Invalid credentials");
    }

    const token = generateToken({ id: user._id, role: user.role });

    res.status(200).json({
        message: "Login successful",
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
        },
    });
});

module.exports = {
    register,
    login,
};
