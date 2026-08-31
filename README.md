# الذكاء العقاري | Smart Real Estate

> **منصة عقارية مصرية متكاملة** — نظام كامل لإدارة وعرض العقارات مع دعم البيع، الإيجار، الحجوزات، التقييمات، والمفضلة.
> **A full-stack Egyptian real estate platform** — property listings, bookings, reviews, favorites, and admin management.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Frontend Overview](#-frontend-pages--features)
- [Backend Overview](#-backend-api)
- [API Endpoints](#-api-endpoints)
- [Installation & Setup](#-installation--setup)
- [Running the Project](#-running-the-project)
- [User Roles](#-user-roles)
- [E2E Testing](#-e2e-testing)
- [Seed Data](#-seed-data)
- [Docker Deployment](#-docker-deployment)

---

## 📖 Overview

**الذكاء العقاري** (Smart Real Estate) is a full-featured real estate platform built for the Egyptian market. It connects property buyers, sellers, and administrators through a modern Arabic-first interface.

### What the Frontend Does

The frontend is a **static HTML/CSS/JS** SPA-style application using Tailwind CSS with Arabic RTL support. It communicates with the backend via REST API calls through a proxy dev server. Key capabilities:

| Feature | Description |
|---------|-------------|
| 🏠 **Landing Page** | Hero section, services grid (شراء/بيع/إيجار), stats counter, testimonials |
| 🔍 **Property Search** | Browse all properties with filtering, sorting, and pagination |
| 📄 **Property Details** | Full property info, images, booking, wishlist, reviews, ratings |
| 🛒 **Booking Flow** | Users can book properties; vendors confirm/reject; auto status management |
| ⭐ **Reviews & Ratings** | Star rating + comment system per property |
| ❤️ **Wishlist** | Save/unsave favorite properties with real-time counter |
| 📊 **User Dashboard** | Role-aware dashboard: properties, bookings, wishlist, account settings |
| 🛡️ **Admin Panel** | User management, property moderation, platform statistics |
| 📝 **Sell Form** | Property listing creation with image upload, category/price/area fields |
| 🔐 **Auth System** | Login/Signup with JWT-based session, role selection (user/vendor) |

### What the Backend Does

The backend is a **Node.js + Express 5 + MongoDB** REST API that powers all data operations:

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | JWT-based register/login with bcrypt password hashing |
| 👥 **Role Management** | Three roles: `user`, `vendor`, `admin` with middleware guards |
| 🏘️ **Property CRUD** | Create, read, update, delete properties with image upload to Cloudinary |
| 🔎 **Search & Filter** | Full-text search, price/area/room filters, sorting, pagination |
| 📅 **Booking System** | Book properties, cancel bookings, vendor confirm/reject workflow |
| ⭐ **Reviews** | Add, update, delete reviews with rating validation (one review per user per property) |
| ❤️ **Favorites** | Add/remove favorites per user, list user favorites |
| 📊 **Admin Operations** | Dashboard stats, user listing/deletion, property moderation |
| 🖼️ **Image Upload** | Multer + Cloudinary integration with 8-image limit, 5MB per image |
| 📚 **API Documentation** | Interactive Swagger UI at `/api-docs` |

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **HTML5** | Page structure |
| **Tailwind CSS** (CDN) | Utility-first styling with Arabic RTL support |
| **Vanilla JavaScript (ES6+)** | DOM manipulation, API calls, state management |
| **Google Fonts (Cairo)** | Arabic-optimized font family |
| **Playwright** | E2E testing framework |

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express 5** | Web framework |
| **MongoDB + Mongoose 9** | Database & ODM |
| **JWT (jsonwebtoken)** | Authentication |
| **bcryptjs** | Password hashing |
| **Cloudinary + Multer** | Image upload & storage |
| **swagger-jsdoc + swagger-ui-express** | API documentation |

---

## 📁 Project Structure

```
smart-real-estate/
│
├── frontend/                 # Frontend (Static HTML/CSS/JS)
│   ├── *.html               # 9 frontend pages
│   ├── assets/
│   │   ├── css/              # Stylesheets
│   │   └── js/               # JavaScript files
│   └── dev-server.js         # Development server + API proxy
│
├── backend/                  # Backend (Node.js/Express)
│   ├── server.js             # Express app entry point
│   ├── seed.js               # MongoDB seed script
│   ├── package.json
│   ├── .env                  # Environment config
│   │
│   ├── config/               # Database & Cloudinary config
│   ├── models/               # Mongoose models
│   ├── controllers/          # Route controllers
│   ├── routes/              # API routes
│   ├── middleware/          # Auth & upload middleware
│   ├── utils/               # Helper utilities
│   └── docs/                # Swagger documentation
│
├── README.md                # English documentation
├── README-Arabic.md         # Arabic documentation
├── run-project.bat          # Quick start (Windows)
└── reseed.bat               # Reset database
```
smart-real-estate/
│
├── *.html                    # 9 frontend pages (see below)
├── assets/
│   ├── css/
│   │   ├── global.css        # Global styles
│   │   ├── auth.css          # Login/signup styles
│   │   ├── home.css           # Home/property listing styles
│   │   └── landing.css       # Landing page styles
│   └── js/
│       ├── api-config.js     # API endpoint definitions
│       └── scripts.js        # All frontend logic (~1400 lines)
│
├── dev-server.js             # Static file server + API proxy
├── tests/
│   └── test-e2e.js           # Playwright E2E tests (17 tests)
├── Dockerfile                # Frontend Docker image
├── nginx-hardened.conf       # Production nginx config
│
└── smart-real-estate-backend/
    ├── server.js             # Express app entry point
    ├── seed.js               # MongoDB seed script
    ├── .env                  # Environment config
    ├── package.json
    │
    ├── config/
    │   ├── db.js             # MongoDB connection
    │   └── cloudinary.js     # Cloudinary setup
    │
    ├── models/
    │   ├── User.js           # name, email, phone, password, role, favorites[]
    │   ├── Property.js       # title, description, price, location, area,
    │   │                     # rooms, bathrooms, type, listingType, status,
    │   │                     # images[], nearbyServices, owner reference
    │   ├── Booking.js        # user, property, status (pending/confirmed/
    │   │                     # cancelled/rejected), timestamps
    │   └── Review.js         # user, property, rating (1-5), comment
    │
    ├── controllers/
    │   ├── authController.js
    │   ├── propertyController.js
    │   ├── bookingController.js
    │   ├── favoriteController.js
    │   ├── reviewController.js
    │   └── adminController.js
    │
    ├── routes/
    │   ├── authRoutes.js
    │   ├── propertyRoutes.js
    │   ├── bookingRoutes.js
    │   ├── favoriteRoutes.js
    │   ├── reviewRoutes.js
    │   └── adminRoutes.js
    │
    ├── middleware/
    │   ├── authMiddleware.js   # JWT verification
    │   ├── roleMiddleware.js   # Role-based access
    │   ├── uploadMiddleware.js # Image upload handling
    │   └── errorMiddleware.js  # Central error handler
    │
    ├── utils/
    │   ├── asyncHandler.js     # Async route wrapper
    │   └── generateToken.js    # JWT generation
    │
    └── docs/
        └── swagger.js          # OpenAPI spec
```

---

## 🖥 Frontend Pages & Features

### 1. `index.html` — Landing Page
- **Path**: `/` or `/index.html`
- **Sections**: Hero banner, services grid (شراء / بيع / إيجار), features, statistics counter, testimonials, footer
- **Auth-aware**: Shows login/signup or dashboard/logout in navbar based on session

### 2. `home.html` — Property Search
- **Path**: `/home.html`
- **Features**: Property cards grid, dynamic listing from API, loading/empty/error states
- **Note**: Sidebar filters were removed (no backend JS wiring) — kept as a static design reference

### 3. `all-properties.html` — Browse & Filter All Properties
- **Path**: `/all-properties.html?type=sale` or `?type=rent`
- **Features**: City parameter filtering, sort by date/price/area, pagination, property cards with formatted pricing

### 4. `details.html` — Property Details
- **Path**: `/details.html?id=PROPERTY_ID`
- **Features**: Image, title, price, location, beds/baths/area, description, buy now button, wishlist toggle, reviews section (star rating + comment + list), contact button

### 5. `sell.html` — List a Property
- **Path**: `/sell.html`
- **Features**: Full form with title, price, rooms, bathrooms, area, category, city, listing type (sale/rent), phone, description, image upload
- **Role-gated**: Requires vendor role — shows 403 message for non-vendors

### 6. `login.html` — Login Page
- **Path**: `/login.html`
- **Features**: Email + password form with JWT token storage in localStorage

### 7. `signup.html` — Registration Page
- **Path**: `/signup.html`
- **Features**: Name, email, phone, password, role selector (user/vendor)

### 8. `dashboard.html` — User Dashboard
- **Path**: `/dashboard.html`
- **Tabs**: عقارات (My Properties), الطلبات (My Bookings / Vendor Bookings), المحفوظة (Wishlist), الحساب (Account Settings)
- **Role-aware UI**: Shows role badge (👤 مستخدم / 🏢 بائع / 🛡️ مدير النظام), contextual permissions and quick links, vendor booking management (confirm/reject buttons), cancel booking button for pending requests

### 9. `admin.html` — Admin Panel
- **Path**: `/admin.html`
- **Sections**: Dashboard statistics (total users, properties, bookings), users management table with delete, properties table with delete/edit, all API-backed
- **Features**: Delete users, edit properties, view platform stats

### 10. `wishlist.html` — Saved Properties
- **Path**: `/wishlist.html`
- **Features**: Grid of favorited properties with remove option, empty state

---

## ⚙️ Backend API

### Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | — | Register user/vendor |
| `POST` | `/api/auth/login` | — | Login → JWT token |

### Property Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/properties` | — | List all properties |
| `GET` | `/api/properties/search` | — | Search with filters, sort, pagination |
| `GET` | `/api/properties/:id` | — | Get property details with reviews |
| `POST` | `/api/properties` | vendor/admin | Create property (multipart) |
| `PUT` | `/api/properties/:id` | vendor/admin | Update property |
| `DELETE` | `/api/properties/:id` | vendor/admin | Delete property |

### Booking Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/bookings` | Bearer | Book a property |
| `GET` | `/api/bookings/my-bookings` | Bearer | User's bookings |
| `PATCH` | `/api/bookings/:id/cancel` | Bearer | Cancel a booking |
| `GET` | `/api/bookings/vendor/all` | vendor | Vendor's incoming bookings |
| `PATCH` | `/api/bookings/:id/confirm` | vendor | Confirm a booking |
| `PATCH` | `/api/bookings/:id/reject` | vendor | Reject a booking |

### Favorite Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/favorites` | Bearer | User's favorites |
| `POST` | `/api/favorites` | Bearer | Add favorite |
| `DELETE` | `/api/favorites/:propertyId` | Bearer | Remove favorite |

### Review Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/reviews/property/:propertyId` | — | Get reviews for a property |
| `POST` | `/api/reviews` | Bearer | Add review |
| `PUT` | `/api/reviews/:reviewId` | Bearer | Update review |
| `DELETE` | `/api/reviews/:reviewId` | Bearer | Delete review |
| `GET` | `/api/reviews/my-reviews` | Bearer | User's reviews |

### Admin Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/admin/dashboard` | admin | Platform statistics |
| `GET` | `/api/admin/users` | admin | All users |
| `DELETE` | `/api/admin/users/:id` | admin | Delete user |
| `GET` | `/api/admin/properties` | admin | All properties with owner |
| `DELETE` | `/api/admin/properties/:id` | admin | Delete property + related data |

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** (v18+)
- **MongoDB** connection string (local or Atlas)
- **Cloudinary** account (for image uploads — optional, works with placeholder images from seed)

### 1. Clone & Install Backend

```bash
cd smart-real-estate-backend
npm install
```

Create `.env` file in `smart-real-estate-backend/`:

```env
PORT=5001
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/smart-real-estate
JWT_SECRET=your_super_secret_key_change_this

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note**: macOS AirPlay uses port 5000. The project uses port 5001 by default to avoid conflicts.

### 2. Seed the Database

```bash
node seed.js
```

Creates: 10+ users (admin, vendors, users), 47+ properties, 9+ bookings, 12+ reviews with realistic Egyptian data.

### 3. Start the Backend

```bash
node server.js
# or: npm run dev (with --watch)
```

Backend runs at: `http://localhost:5001`
Swagger docs at: `http://localhost:5001/api-docs`

### 4. Frontend (Dev Server)

From the project root:

```bash
node dev-server.js
```

Frontend runs at: `http://localhost:8000`
API proxy: `/api/*` → `http://localhost:5001`

The dev server serves static files and proxies API calls to the backend — no build step needed.

### 5. Seed Login Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@seed.com` | `password123` | 🛡️ Admin |
| `vendor1@seed.com` | `password123` | 🏢 Vendor |
| `user1@seed.com` | `password123` | 👤 User |
| *(plus 7+ more users in seed.js)* | `password123` | Mixed |

---

## 🧪 E2E Testing

Playwright-based E2E tests cover the full user journey:

```bash
npx playwright install chromium
node tests/test-e2e.js
```

**17 tests** covering:
1. Homepage loads with correct title and hero
2. Login with seed user
3. Browse all properties (grid loads)
4. Filter by sale/rent type
5. View property details
6. Toggle wishlist (add/remove)
7. Submit a review with star rating
8. Book a property
9. Cancel a booking
10. Logout and verify session cleared
11. Login as vendor, verify dashboard
12. Vendor booking management (confirm booking)
13. Admin login and dashboard stats
14. Admin user management
15. Admin property management
16. Sell form shows 403 for non-vendor
17. Sell form submits for vendor

---

## 👥 User Roles

### 👤 User
- Browse properties with search, filter, sort
- View property details
- Save/unsave favorite properties
- Book properties (creates pending booking)
- Cancel own pending bookings
- Rate and review properties
- View personal dashboard (bookings, wishlist, account info)

### 🏢 Vendor
- All User permissions
- Create property listings with images
- Edit/delete own properties
- View incoming booking requests for owned properties
- Confirm or reject booking requests
- Vendor-specific dashboard tab

### 🛡️ Admin
- All Vendor permissions (on all properties)
- Platform-wide dashboard with statistics
- Manage all users (view, delete)
- Manage all properties (view, delete)
- Dedicated admin panel

---

## 🔑 Key Business Logic

- **One review per user per property**: Users can only rate a property once
- **One active booking per property per user**: Prevents duplicate bookings
- **Property status auto-management**: Available → Booked (on booking) → Available (on cancel/reject)
- **Vendor booking flow**: Users create pending bookings → Vendor confirms or rejects
- **JWT session**: Token stored in localStorage, sent via Authorization header
- **Role-based UI**: Navbar items, dashboard tabs, and buttons adapt to user role
- **Wishlist sync**: Favorites loaded from backend on page load, kept in sync with UI counter

---

## 🐳 Docker Deployment

The project includes a `Dockerfile` and `nginx-hardened.conf` for production deployment:

```bash
docker build -t smart-real-estate .
docker run -d -p 8080:80 smart-real-estate
```

The nginx config includes:
- Static file serving with caching
- API proxy to backend
- Security headers (HSTS, X-Frame-Options, etc.)
- Gzip compression
- Rate limiting

---

## 📝 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 5000 | Backend server port |
| `MONGO_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | JWT signing secret |
| `CLOUDINARY_CLOUD_NAME` | No | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | — | Cloudinary API secret |

---

## 🌐 API Base URLs

| Environment | URL |
|-------------|-----|
| Backend API | `http://localhost:5001` |
| Swagger Docs | `http://localhost:5001/api-docs` |
| Frontend (dev) | `http://localhost:8000` |
| API Proxy | `http://localhost:8000/api/*` → backend |

---

## 📄 License

This project is built as a graduation project. All rights reserved.

---

*Built with ❤️ by the الذكاء العقاري team*
