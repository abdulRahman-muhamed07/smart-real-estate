// Configure Multer to upload image files directly to Cloudinary.
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "smart-real-estate/properties",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 1280, height: 720, crop: "limit" }],
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
        return cb(null, true);
    }

    return cb(new Error("Only image files are allowed (jpg, jpeg, png, webp)"));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

const uploadPropertyImages = (req, res, next) => {
    upload.array("images", 8)(req, res, (err) => {
        if (!err) {
            return next();
        }

        if (err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE") {
            err.statusCode = 400;
            err.message = "Each image must be 5MB or smaller";
            return next(err);
        }

        if (err.message === "Only image files are allowed (jpg, jpeg, png, webp)") {
            err.statusCode = 400;
            return next(err);
        }

        return next(err);
    });
};

module.exports = {
    upload,
    uploadPropertyImages,
};
