// ============================================
// API Configuration
// ============================================
const APP_CONFIG = window.APP_CONFIG || {};
const API_BASE = normalizeApiBase(
    APP_CONFIG.apiBaseUrl ||
    localStorage.getItem('SMART_ESTATE_API_BASE') ||
    '/api'
);

const API_ENDPOINTS = {
    login: '/auth/login',
    register: '/auth/register',
    properties: '/properties',
    propertiesSearch: '/properties/search',
    propertyDetails: (id) => '/properties/' + encodeURIComponent(id),
    propertyAdd: '/properties',
    propertyUpdate: (id) => '/properties/' + encodeURIComponent(id),
    propertyDelete: (id) => '/properties/' + encodeURIComponent(id),
    bookingsCreate: '/bookings',
    bookingsMy: '/bookings/my-bookings',
    bookingsCancel: (id) => '/bookings/' + encodeURIComponent(id) + '/cancel',
    vendorBookings: '/bookings/vendor/all',
    vendorBookingConfirm: (id) => '/bookings/' + encodeURIComponent(id) + '/confirm',
    vendorBookingReject: (id) => '/bookings/' + encodeURIComponent(id) + '/reject',
    reviews: '/reviews',
    reviewsProperty: (id) => '/reviews/property/' + encodeURIComponent(id),
    reviewsMy: '/reviews/my-reviews',
    favorites: '/favorites',
    favoriteRemove: (id) => '/favorites/' + encodeURIComponent(id),
    adminUsers: '/admin/users',
    adminUsersDelete: (id) => '/admin/users/' + encodeURIComponent(id),
    adminDashboard: '/admin/dashboard',
    adminProperties: '/admin/properties',
    adminPropertiesDelete: (id) => '/admin/properties/' + encodeURIComponent(id),
};

Object.assign(API_ENDPOINTS, APP_CONFIG.endpoints || {});

function normalizeApiBase(value) {
    if (!value || value === '/') return '';
    return String(value).replace(/\/$/, '');
}

function endpoint(name, ...args) {
    const value = API_ENDPOINTS[name];
    return typeof value === 'function' ? value(...args) : value;
}

function buildApiUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE}${normalizedPath}`;
}

// ============================================
// General Helpers
// ============================================
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

function getCsrfToken() {
    return getCookie('XSRF-TOKEN') || getCookie('CSRF-TOKEN') || getCookie('__RequestVerificationToken');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttr(value) {
    return escapeHtml(value);
}

function jsArg(value) {
    return JSON.stringify(String(value ?? '')).replace(/</g, '\\u003c');
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '';
}

function setHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value ?? '';
}

function asArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    const keys = ['data', 'items', 'results', 'value', 'properties', 'users', 'favorites', 'bookings', 'requests', 'inquiries'];
    for (const key of keys) {
        if (Array.isArray(payload[key])) return payload[key];
    }

    for (const key of keys) {
        if (payload[key] && typeof payload[key] === 'object') {
            const nested = asArray(payload[key]);
            if (nested.length) return nested;
        }
    }

    return [];
}

function getTotalCount(payload) {
    if (!payload || typeof payload !== 'object') return asArray(payload).length;
    const keys = ['totalCount', 'count', 'total', 'recordsTotal'];
    for (const key of keys) {
        if (typeof payload[key] === 'number') return payload[key];
    }
    return asArray(payload).length;
}

function firstDefined(obj, keys, fallback = '') {
    for (const key of keys) {
        const value = obj?.[key];
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
}

function formatCurrency(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return '';
    if (numeric >= 10000000) {
        return `${Math.round(numeric / 1000000)}M+ ج.م`;
    }
    if (numeric >= 1000000) {
        const val = numeric / 1000000;
        return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M ج.م`;
    }
    if (numeric >= 1000) {
        return `${Math.round(numeric / 1000)}K ج.م`;
    }
    return `${numeric.toLocaleString()} ج.م`;
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatApiErrors(data, fallback) {
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (data.message) return data.message;
    if (data.title) return data.title;
    if (Array.isArray(data)) {
        return data.map(item => item.description || item.message || String(item)).join('\n');
    }
    if (data.errors && typeof data.errors === 'object') {
        return Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
    }
    return fallback;
}

async function apiCall(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const hasBody = options.body !== undefined && options.body !== null;
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    if (hasBody && !isFormData && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const token = localStorage.getItem('authToken');
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const csrfToken = getCsrfToken();
    if (csrfToken && !headers.has('X-XSRF-TOKEN')) {
        headers.set('X-XSRF-TOKEN', decodeURIComponent(csrfToken));
    }

    const requestOptions = {
        credentials: 'include',
        ...options,
        headers
    };

    const res = await fetch(buildApiUrl(path), requestOptions);
    const text = await res.text();
    let data = {};

    if (text) {
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = text;
        }
    }

    if (!res.ok) {
        const err = new Error(formatApiErrors(data, `HTTP ${res.status}`));
        err.status = res.status;
        err.data = data;
        err.endpoint = path;
        throw err;
    }

    return data;
}

async function apiCallForm(path, formData) {
    return apiCall(path, {
        method: 'POST',
        body: formData
    });
}

async function tryApiGet(paths, options = {}) {
    const candidates = Array.isArray(paths) ? paths : [paths];
    let authError = null;
    let lastError = null;

    for (const path of candidates.filter(Boolean)) {
        try {
            return await apiCall(path);
        } catch (e) {
            lastError = e;
            if (e.status === 401 || e.status === 403) authError = e;
            if (e.status && e.status !== 404 && e.status !== 405) {
                console.warn('API endpoint failed:', path, e);
            }
        }
    }

    if (options.throwAuth && authError) throw authError;
    if (options.throwLast && lastError) throw lastError;
    return options.fallback ?? null;
}

// ============================================
// Auth Helpers
// ============================================
function isLoggedIn() {
    if (localStorage.getItem('isLoggedIn') === 'true') return true;
    if (localStorage.getItem('authToken')) return true;
    return false;
}

function setLoggedIn(val) {
    localStorage.setItem('isLoggedIn', val ? 'true' : 'false');
    if (!val) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
}

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch (e) {
        return null;
    }
}

function saveUser(user) {
    if (!user || typeof user !== 'object') return;
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function setAuthState(data) {
    setLoggedIn(true);
    const token = data?.token || data?.accessToken || data?.jwt || data?.data?.token || data?.data?.accessToken;
    if (token) localStorage.setItem('authToken', token);

    const user = data?.user || data?.data?.user || data?.data || data;
    if (user && typeof user === 'object') saveUser(user);
}

function getUserRoles(user = getStoredUser()) {
    const roles = firstDefined(user, ['roles', 'role', 'userRoles', 'claims'], []);
    if (Array.isArray(roles)) {
        return roles.map(role => String(role.name || role.type || role).toLowerCase());
    }
    return String(roles || '').split(',').map(role => role.trim().toLowerCase()).filter(Boolean);
}

function isAdminUser(user = getStoredUser()) {
    if (!user) return false;
    if (user.isAdmin === true || user.isAdministrator === true) return true;
    return getUserRoles(user).some(role => ['admin', 'administrator', 'superadmin'].includes(role));
}

function getUserDisplayName(user = getStoredUser()) {
    if (!user) return 'مستخدم';
    return firstDefined(user, ['fullName', 'name', 'displayName'], '') ||
        `${firstDefined(user, ['firstName'], '')} ${firstDefined(user, ['lastName'], '')}`.trim() ||
        firstDefined(user, ['email', 'userName'], 'مستخدم');
}

async function getCurrentUser(force = false) {
    if (!isLoggedIn()) return null;
    return getStoredUser();
}

function paintAuthNav(user) {
    const admin = isAdminUser(user);
    document.querySelectorAll('.admin-only').forEach(el => {
        el.classList.toggle('hidden', !admin);
        el.style.display = admin ? '' : 'none';
    });
    document.querySelectorAll('.nav-user-name').forEach(el => {
        el.textContent = getUserDisplayName(user);
    });
}

async function updateAuthNav() {
    const loggedIn = isLoggedIn();
    document.querySelectorAll('.nav-auth-logged-in').forEach(el => {
        el.style.display = loggedIn ? '' : 'none';
    });
    document.querySelectorAll('.nav-auth-logged-out').forEach(el => {
        el.style.display = loggedIn ? 'none' : '';
    });

    paintAuthNav(getStoredUser());
    if (loggedIn) {
        const user = await getCurrentUser();
        paintAuthNav(user);
    }
}

function requireLogin() {
    if (isLoggedIn()) return true;
    const returnUrl = encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search);
    window.location.href = `login.html?returnUrl=${returnUrl}`;
    return false;
}

async function logout() {
    setLoggedIn(false);
    window.location.href = 'login.html';
}

// ============================================
// Property Helpers
// ============================================
function getPriceValue(price) {
    return Number(price) || 0;
}

function getPropertyId(p) {
    return firstDefined(p, ['_id', 'id', 'propertyId', 'Id']);
}

function getPropertyTitle(p) {
    return firstDefined(p, ['title', 'name', 'propertyTitle'], 'عقار بدون عنوان');
}

function getPropertyCity(p) {
    return p?.city?.name || p?.cityName || p?.location || '';
}

function getPropertyCategory(p) {
    return p?.category?.name || p?.categoryName || p?.type || 'عقار';
}

function getPropertyArea(p) {
    return firstDefined(p, ['area', 'size', 'squareMeters'], 0);
}

function getPropertyRooms(p) {
    return firstDefined(p, ['bedrooms', 'rooms', 'roomCount'], 0);
}

function getPropertyBaths(p) {
    return firstDefined(p, ['bathrooms', 'baths', 'bathroomCount'], 0);
}

function getPropertyImage(p) {
    return firstDefined(p, ['imageUrl', 'mainImageUrl', 'photoUrl', 'image'], '') ||
        p?.images?.[0]?.url ||
        p?.images?.[0] ||
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800';
}

function getPropertyImages(p) {
    const fallback = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800';
    if (p?.images && Array.isArray(p.images) && p.images.length > 0) {
        return p.images.map(i => (typeof i === 'string' ? i : i?.url)).filter(Boolean);
    }
    const single = firstDefined(p, ['imageUrl', 'mainImageUrl', 'photoUrl', 'image'], '');
    return single ? [single] : [fallback];
}

function getStatusLabel(p) {
    const listingType = String(firstDefined(p, ['listingType', 'status', 'statusName'], '')).toLowerCase();
    if (p?.isForRent || listingType === '2' || listingType.includes('rent') || listingType.includes('إيجار')) return 'للإيجار';
    return 'للبيع';
}

function isPropertyApproved(p) {
    if (p?.isApproved !== undefined) return Boolean(p.isApproved);
    if (p?.approved !== undefined) return Boolean(p.approved);
    const status = String(firstDefined(p, ['approvalStatus', 'status', 'statusName'], '')).toLowerCase();
    if (!status) return true;
    return !(status.includes('pending') || status.includes('review') || status.includes('قيد') || status === '0');
}

function getApprovalBadge(p) {
    if (isPropertyApproved(p)) {
        return { text: getStatusLabel(p), className: 'bg-emerald-100 text-emerald-700' };
    }
    return { text: 'قيد المراجعة', className: 'bg-amber-100 text-amber-700' };
}

function normalizeWishlistId(id) {
    return String(id ?? '');
}

// ============================================
// Mobile Menu
// ============================================
function heroSearch() {
    const query = document.getElementById('hero-search')?.value?.trim();
    if (!query) {
        window.location.href = 'all-properties.html';
    } else {
        window.location.href = 'all-properties.html?search=' + encodeURIComponent(query);
    }
}

function toggleMobileMenu() {
    const nav = document.getElementById('mobile-nav');
    if (nav) nav.classList.toggle('hidden');
}

// ============================================
// Property Cards and Listings
// ============================================
function createCard(p) {
    const id = getPropertyId(p);
    const img = getPropertyImage(p);
    const cat = getPropertyCategory(p);
    const city = getPropertyCity(p);
    const price = formatCurrency(firstDefined(p, ['price', 'amount'], 0));
    const rooms = getPropertyRooms(p);
    const area = getPropertyArea(p);
    const label = getStatusLabel(p);
    const title = getPropertyTitle(p);

    return `
        <div class="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group border border-slate-100 animate-section">
            <a href="details.html?id=${encodeURIComponent(id)}" class="block relative h-72 overflow-hidden">
                <img src="${escapeAttr(img)}" alt="${escapeAttr(title)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute top-6 right-6 flex gap-2">
                    <span class="bg-white/90 backdrop-blur-md text-blue-700 px-4 py-1.5 rounded-full text-xs font-black shadow-sm">${escapeHtml(label)}</span>
                    <span class="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black shadow-sm">${escapeHtml(cat)}</span>
                </div>
            </a>
            <div class="p-8">
                <div class="flex justify-between items-start gap-4 mb-4">
                    <div class="min-w-0 flex-1">
                        <h4 class="font-black text-xl mb-1 group-hover:text-blue-700 transition leading-snug" title="${escapeHtml(title)}">${escapeHtml(title)}</h4>
                        <p class="text-slate-400 text-xs font-bold">${city ? `📍 ${escapeHtml(city)}` : ''}</p>
                    </div>
                    <div class="text-blue-700 font-black text-lg text-left flex-shrink-0 min-w-fit">${escapeHtml(price)}</div>
                </div>
                <div class="flex gap-6 py-6 border-y border-slate-50 mb-6">
                    <div class="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">🛏️ ${escapeHtml(rooms)} Beds</div>
                    <div class="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">📏 ${escapeHtml(area)} m²</div>
                </div>
                <a href="details.html?id=${encodeURIComponent(id)}" class="font-black text-blue-700 hover:gap-3 flex items-center gap-2 transition-all">التفاصيل <span>←</span></a>
            </div>
        </div>
    `;
}

let properties = [];
let propertiesLoaded = false;

async function loadProperties() {
    if (propertiesLoaded && properties.length > 0) return properties;
    try {
        const data = await apiCall(endpoint('properties'));
        properties = asArray(data);
        propertiesLoaded = true;
        return properties;
    } catch (e) {
        console.error('Failed to load properties:', e);
        properties = [];
        propertiesLoaded = true;
        return [];
    }
}

async function renderGrids() {
    const allGrid = document.getElementById('grid-all');
    const props = await loadProperties();

    if (allGrid) {
        allGrid.innerHTML = props.length
            ? props.slice(0, 6).map(p => createCard(p)).join('')
            : '<p class="text-center text-slate-400 col-span-3 py-12 font-bold">لا توجد عقارات حالياً. تحقق لاحقاً!</p>';
    }
}

// ============================================
// Image Slider
// ============================================
let _sliderIndex = 0;

function renderImageSlider(images) {
    const container = document.getElementById('prop-slider');
    if (!container) {
        // Fallback: single image element
        const imgEl = document.getElementById('prop-img');
        if (imgEl && images.length > 0) imgEl.src = images[0];
        return;
    }
    _sliderIndex = 0;
    if (!images || images.length === 0) {
        container.innerHTML = `<img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800" class="w-full h-full object-cover">`;
        return;
    }
    if (images.length === 1) {
        container.innerHTML = `<img src="${escapeAttr(images[0])}" class="w-full h-full object-cover">`;
        return;
    }
    const dots = images.map((_, i) =>
        `<button onclick="sliderGo(${i})" data-dot="${i}" class="w-2.5 h-2.5 rounded-full transition-all ${i === 0 ? 'bg-white scale-125' : 'bg-white/50'}"></button>`
    ).join('');
    container.innerHTML = `
        <div class="relative w-full h-full" id="slider-inner">
            <div class="w-full h-full overflow-hidden">
                <div id="slider-track" class="flex h-full transition-transform duration-500" style="width:${images.length * 100}%;transform:translateX(0%)">
                    ${images.map(url => `<div style="width:${100 / images.length}%" class="h-full flex-shrink-0"><img src="${escapeAttr(url)}" class="w-full h-full object-cover"></div>`).join('')}
                </div>
            </div>
            <button onclick="sliderPrev()" class="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full font-black text-lg flex items-center justify-center transition z-10">&#8250;</button>
            <button onclick="sliderNext(${images.length})" class="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full font-black text-lg flex items-center justify-center transition z-10">&#8249;</button>
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" id="slider-dots">${dots}</div>
            <div class="absolute top-3 left-3 bg-black/50 text-white text-xs font-black px-3 py-1 rounded-full" id="slider-count">1 / ${images.length}</div>
        </div>
    `;
    window._sliderImages = images;
}

function sliderGo(index) {
    const images = window._sliderImages || [];
    if (!images.length) return;
    _sliderIndex = Math.max(0, Math.min(index, images.length - 1));
    const track = document.getElementById('slider-track');
    if (track) track.style.transform = `translateX(-${_sliderIndex * (100 / images.length)}%)`;
    document.querySelectorAll('[data-dot]').forEach(d => {
        const active = parseInt(d.dataset.dot) === _sliderIndex;
        d.className = `w-2.5 h-2.5 rounded-full transition-all ${active ? 'bg-white scale-125' : 'bg-white/50'}`;
    });
    const countEl = document.getElementById('slider-count');
    if (countEl) countEl.textContent = `${_sliderIndex + 1} / ${images.length}`;
}

function sliderNext(total) { sliderGo((_sliderIndex + 1) % total); }
function sliderPrev() { sliderGo((_sliderIndex - 1 + (window._sliderImages?.length || 1)) % (window._sliderImages?.length || 1)); }

async function loadPropertyDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        showPropertyNotFound();
        return;
    }

    try {
        const data = await apiCall(endpoint('propertyDetails', id));
        const p = data.property || data;

        // Render image slider (supports multiple images)
        const images = getPropertyImages(p);
        renderImageSlider(images);

        setText('prop-title', getPropertyTitle(p));
        setText('prop-price', formatCurrency(firstDefined(p, ['price', 'amount'], 0)));
        setText('prop-location', getPropertyCity(p));
        setText('prop-loc', getPropertyCity(p) ? `📍 ${getPropertyCity(p)}` : '');
        setText('prop-description', firstDefined(p, ['description', 'details'], ''));
        setText('prop-desc', firstDefined(p, ['description', 'details'], 'لا يوجد وصف'));
        setText('prop-area', getPropertyArea(p) ? `${getPropertyArea(p)} m²` : '');
        setText('prop-sqft', getPropertyArea(p) ? `${getPropertyArea(p)} m²` : '');
        setText('prop-rooms', getPropertyRooms(p));
        setText('prop-beds', getPropertyRooms(p));
        setText('prop-baths', getPropertyBaths(p));
        setText('prop-category', getPropertyCategory(p));
        setText('prop-match', getPropertyCategory(p));

        const wishlistBtn = document.getElementById('details-wishlist-btn');
        if (wishlistBtn) {
            wishlistBtn.dataset.id = getPropertyId(p);
            updateWishlistUI();
        }

        // Load reviews
        currentPropertyId = getPropertyId(p);
        loadReviews(currentPropertyId);

        // Update buy button based on property status
        const buyBtn = document.querySelector('button[onclick*="handleBuyNow"]');
        const propStatus = (p.status || '').toLowerCase();
        if (buyBtn && (propStatus === 'booked' || propStatus === 'sold' || propStatus === 'rented')) {
            buyBtn.textContent = propStatus === 'sold' ? 'تم البيع' : 'محجوز';
            buyBtn.disabled = true;
            buyBtn.className = 'flex-1 bg-slate-300 text-slate-500 font-black py-6 rounded-2xl transition-all text-xl cursor-not-allowed';
        }
    } catch (e) {
        console.error('Failed to load property:', e);
        showPropertyNotFound();
    }
}

function showPropertyNotFound() {
    document.getElementById('property-details-container')?.classList.add('hidden');
    document.getElementById('not-found')?.classList.remove('hidden');
}

// ============================================
// Login and Signup
// ============================================
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');

    if (!email || !password) {
        if (errEl) {
            errEl.textContent = 'يرجى ملء جميع الحقول';
            errEl.classList.remove('hidden');
        }
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = 'جاري تسجيل الدخول...';
    }
    if (errEl) errEl.classList.add('hidden');

    try {
        const data = await apiCall(endpoint('login'), {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        setAuthState(data);
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        const safeReturnUrl = returnUrl && !/^https?:\/\//i.test(returnUrl) ? returnUrl : '';
        window.location.href = safeReturnUrl || (isAdminUser() ? 'admin.html' : 'dashboard.html');
    } catch (e) {
        if (errEl) {
            errEl.textContent = formatApiErrors(e.data, 'فشل تسجيل الدخول');
            errEl.classList.remove('hidden');
        }
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'تسجيل الدخول';
        }
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');

    const firstName = form.elements['firstName']?.value;
    const lastName = form.elements['lastName']?.value;
    const email = form.elements['email']?.value;
    const password = form.elements['password']?.value;
    const confirmPassword = form.elements['confirmPassword']?.value;

    if (!firstName || !lastName || !email || !password) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    if (password !== confirmPassword) {
        alert('كلمتا المرور غير متطابقتين');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'جاري إنشاء الحساب...';

    try {
        const name = (firstName + ' ' + lastName).trim();
        const role = form.elements['role']?.value || 'user';
        const data = await apiCall(endpoint('register'), {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role })
        });
        alert(data.message || 'تم إنشاء الحساب بنجاح');
        window.location.href = 'login.html';
    } catch (e) {
        alert(formatApiErrors(e.data, 'فشل إنشاء الحساب'));
        btn.disabled = false;
        btn.textContent = 'انشاء حساب';
    }
}

// ============================================
// Sell Form
// ============================================
async function handleSellForm(event) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    if (!requireLogin()) return;

    btn.disabled = true;
    btn.textContent = 'جاري الإرسال...';

    // Detect edit mode
    const editId = new URLSearchParams(window.location.search).get('edit');
    const isEdit = Boolean(editId);

    try {
        const raw = new FormData(form);
        const formData = new FormData();

        // Title, description, price, rooms, bathrooms, area
        formData.append('title', raw.get('title') || raw.get('Title') || '');
        formData.append('description', raw.get('description') || raw.get('Description') || '');
        formData.append('price', raw.get('price') || raw.get('Price') || '');
        formData.append('rooms', raw.get('rooms') || raw.get('Rooms') || '');
        formData.append('bathrooms', raw.get('bathrooms') || raw.get('Bathrooms') || '');
        formData.append('area', raw.get('area') || raw.get('Area') || '');

        // Property type: direct value (apartment, villa, etc.)
        formData.append('type', raw.get('type') || 'apartment');

        // Location: free text input
        formData.append('location', raw.get('location') || '');

        // Listing type: sale or rent
        formData.append('listingType', raw.get('listingType') || 'sale');

        // Status (available / booked / sold)
        const statusVal = raw.get('status');
        if (statusVal) formData.append('status', statusVal);

        // Nearby services: comma-separated
        const nearby = raw.get('nearbyServices');
        if (nearby) formData.append('nearbyServices', nearby);

        // Images: support multiple files
        const imageFiles = raw.getAll('images');
        let hasNewImages = false;
        for (const file of imageFiles) {
            if (file && file.size > 0) {
                formData.append('images', file);
                hasNewImages = true;
            }
        }
        // Fallback: old single-file field name
        if (!hasNewImages) {
            const legacy = raw.get('ImageFile');
            if (legacy && legacy.size > 0) formData.append('images', legacy);
        }

        if (isEdit) {
            await apiCall(endpoint('propertyUpdate', editId), { method: 'PUT', body: formData });
            alert('تم تحديث العقار بنجاح!');
            window.location.href = 'dashboard.html';
        } else {
            await apiCall(endpoint('propertyAdd'), { method: 'POST', body: formData });
            alert('تم إضافة العقار بنجاح!');
            form.reset();
            btn.textContent = 'تم الإرسال';
            btn.classList.add('bg-green-600');
        }
    } catch (e) {
        console.error('SELL ERROR:', e.data || e);
        const errorMsg = e.status === 403
            ? 'تحتاج صلاحيات بائع لنشر عقار. تواصل مع الإدارة لترقية حسابك.'
            : formatApiErrors(e.data, 'فشل الإرسال');
        alert(errorMsg);
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// ============================================
// Wishlist
// ============================================
let wishlist = [];
try {
    wishlist = (JSON.parse(localStorage.getItem('property_wishlist')) || []).map(normalizeWishlistId);
} catch (e) {
    wishlist = [];
}

function wishlistHas(id) {
    return wishlist.includes(normalizeWishlistId(id));
}

// Sync backend favorites to local wishlist on login.
async function syncWishlistFromBackend() {
    if (!isLoggedIn()) return;
    try {
        const data = await apiCall(endpoint('favorites'));
        const ids = (data.favorites || []).map(f => normalizeWishlistId(f._id));
        // Merge: keep existing local items, add backend items not yet local
        const existing = new Set(wishlist);
        for (const id of ids) {
            if (!existing.has(id)) {
                wishlist.push(id);
                existing.add(id);
            }
        }
        localStorage.setItem('property_wishlist', JSON.stringify(wishlist));
        updateWishlistUI();
    } catch (e) {
        console.warn('Failed to sync favorites from backend:', e);
    }
}

async function toggleWishlist(id) {
    const normalized = normalizeWishlistId(id);
    if (!normalized) return;

    // Require login for favorites
    if (!isLoggedIn()) {
        if (confirm('يجب تسجيل الدخول لإضافة العقارات للمفضلة. هل تريد تسجيل الدخول الآن؟')) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }
        return;
    }

    const index = wishlist.indexOf(normalized);
    if (index === -1) {
        try {
            await apiCall(endpoint('favorites'), { method: 'POST', body: JSON.stringify({ propertyId: normalized }) });
        } catch (e) {
            if (e.data?.message?.includes('already')) {
                // Already in favorites, just add to local
            } else {
                console.warn('Failed to add favorite:', e);
                alert(formatApiErrors(e.data, 'فشل الإضافة للمفضلة'));
                return;
            }
        }
        wishlist.push(normalized);
    } else {
        try {
            await apiCall(endpoint('favoriteRemove', normalized), { method: 'DELETE' });
        } catch (e) { console.warn('Failed to remove favorite:', e); return; }
        wishlist.splice(index, 1);
    }
    localStorage.setItem('property_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
}

function updateWishlistUI() {
    document.querySelectorAll('.wishlist-counter').forEach(c => {
        c.innerText = wishlist.length;
        c.classList.toggle('hidden', wishlist.length === 0);
    });
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const id = btn.dataset.id;
        const icon = btn.querySelector('.heart-icon');
        if (!icon) return;
        if (wishlistHas(id)) {
            icon.innerText = '❤️';
            btn.classList.add('text-red-500');
            btn.classList.remove('text-slate-400');
        } else {
            icon.innerText = '🤍';
            btn.classList.add('text-slate-400');
            btn.classList.remove('text-red-500');
        }
    });
}

// ============================================
// Buy Now / Contact
// ============================================
async function submitPropertyRequest(propertyId) {
    try {
        await apiCall(endpoint('bookingsCreate'), {
            method: 'POST',
            body: JSON.stringify({ propertyId })
        });
        return true;
    } catch (e) {
        console.warn('Booking endpoint failed:', e);
        return false;
    }
}

async function handleBuyNow() {
    if (!requireLogin()) return;
    const propertyId = new URLSearchParams(window.location.search).get('id');
    if (propertyId) {
        const success = await submitPropertyRequest(propertyId);
        if (!success) {
            alert('تعذر تسجيل الطلب حالياً. هذا العقار قد يكون محجوزاً بالفعل.');
            return;
        }
    }

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl';
    overlay.innerHTML = `
        <div class="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl">
            <div class="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">✓</div>
            <h2 class="text-4xl font-black mb-4">تم تسجيل اهتمامك</h2>
            <p class="text-slate-500 font-bold text-lg mb-8">سيقوم مستشارنا العقاري بالتواصل معك خلال 30 دقيقة.</p>
            <button onclick="this.closest('.fixed').remove()" class="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-slate-800 transition-all">حسناً</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

// ============================================
// Reviews
// ============================================
let currentReviewRating = 0;
let currentPropertyId = null;

function setReviewRating(rating) {
    currentReviewRating = rating;
    document.querySelectorAll('.review-star').forEach((star, i) => {
        star.classList.toggle('text-yellow-400', i < rating);
        star.classList.toggle('text-slate-300', i >= rating);
    });
}

async function loadReviews(propertyId) {
    const container = document.getElementById('reviews-list');
    if (!container || !propertyId) return;
    
    try {
        const data = await apiCall(endpoint('reviewsProperty', propertyId));
        const reviews = data.reviews || [];
        
        if (reviews.length === 0) {
            container.innerHTML = isLoggedIn()
                ? '<div class="text-center text-slate-400 font-bold py-8">لا توجد تقييمات بعد. كن أول من يقيم!</div>'
                : '<div class="text-center text-slate-400 font-bold py-8">لا توجد تقييمات بعد. <a href="login.html" class="text-blue-600 hover:underline">سجل دخول</a> لتقييم هذا العقار.</div>';
            return;
        }
        
        container.innerHTML = reviews.map(r => `
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-2">
                        <span class="font-black">${escapeHtml(r.user?.name || r.userName || 'مستخدم')}</span>
                        <span class="text-yellow-400 text-sm">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    <span class="text-slate-400 text-xs font-bold">${formatDate(r.createdAt)}</span>
                </div>
                <p class="text-slate-600 font-bold">${escapeHtml(r.comment || r.review || '')}</p>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<div class="text-center text-slate-400 font-bold py-8">تعذر تحميل التقييمات</div>';
    }
}

async function submitReview() {
    if (!requireLogin()) return;
    if (!currentReviewRating) {
        document.getElementById('review-error').textContent = 'يرجى اختيار تقييم';
        document.getElementById('review-error').classList.remove('hidden');
        return;
    }
    const comment = document.getElementById('review-comment')?.value?.trim();
    if (!comment) {
        document.getElementById('review-error').textContent = 'يرجى كتابة تعليق';
        document.getElementById('review-error').classList.remove('hidden');
        return;
    }
    
    document.getElementById('review-error').classList.add('hidden');
    
    try {
        await apiCall(endpoint('reviews'), {
            method: 'POST',
            body: JSON.stringify({ propertyId: currentPropertyId, rating: currentReviewRating, comment })
        });
        alert('تم إرسال تقييمك بنجاح');
        setReviewRating(0);
        document.getElementById('review-comment').value = '';
        await loadReviews(currentPropertyId);
    } catch (e) {
        document.getElementById('review-error').textContent = formatApiErrors(e.data, 'فشل إرسال التقييم');
        document.getElementById('review-error').classList.remove('hidden');
    }
}

// ============================================
// Sort Helper
// ============================================
function sortProperties(list, criteria) {
    const sorted = [...list];
    switch (criteria) {
        case 'price-low':
            return sorted.sort((a, b) => getPriceValue(firstDefined(a, ['price', 'amount'], 0)) - getPriceValue(firstDefined(b, ['price', 'amount'], 0)));
        case 'price-high':
            return sorted.sort((a, b) => getPriceValue(firstDefined(b, ['price', 'amount'], 0)) - getPriceValue(firstDefined(a, ['price', 'amount'], 0)));
        case 'newest':
        default:
            return sorted.sort((a, b) => {
                const dateA = a.createdAt || getPropertyId(a);
                const dateB = b.createdAt || getPropertyId(b);
                return String(dateB).localeCompare(String(dateA));
            });
    }
}

// ============================================
// Location Cards
// ============================================
const locationList = [
    { name: 'القاهرة الجديدة', title: 'أفضل الوجهات للسكن', img: 'https://images.unsplash.com/photo-1582408921715-18e7806367c1?auto=format&fit=crop&w=800' },
    { name: 'التجمع الخامس', title: 'إطلالات خلابة وحدائق', img: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800' },
    { name: 'مدينة الشروق', title: 'هدوء وخصوصية تامة', img: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800' }
];

function renderLocationCards() {
    const locGrid = document.getElementById('grid-locations');
    if (!locGrid) return;
    locGrid.innerHTML = locationList.map(l => `
        <a href="all-properties.html?city=${encodeURIComponent(l.name)}" class="block relative overflow-hidden rounded-[2.5rem] h-80 group cursor-pointer shadow-lg border border-white">
            <img src="${escapeAttr(l.img)}" alt="${escapeAttr(l.name)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end text-white">
                <h4 class="text-2xl font-black mb-1">${escapeHtml(l.name)}</h4>
                <p class="text-white/70 font-bold mb-4">${escapeHtml(l.title)}</p>
            </div>
        </a>
    `).join('');
}

// ============================================
// User Dashboard
// ============================================
let userDashboardState = {
    properties: [],
    requests: [],
    saved: [],
    currentTab: 'properties'
};

function switchDashboardTab(tab) {
    userDashboardState.currentTab = tab;
    ['properties', 'requests', 'saved', 'account'].forEach(name => {
        document.getElementById(`dashboard-${name}`)?.classList.toggle('hidden', name !== tab);
        const btn = document.getElementById(`tab-${name}`);
        if (btn) {
            btn.className = name === tab
                ? 'px-5 py-3 bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-100 transition'
                : 'px-5 py-3 bg-white text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition shadow-sm border border-slate-100';
        }
    });
}

function renderStatusBadge(text, className) {
    return `<span class="${className} px-3 py-1 rounded-full text-xs font-black whitespace-nowrap">${escapeHtml(text)}</span>`;
}

function renderUserPropertyRow(p) {
    const id = getPropertyId(p);
    const badge = getApprovalBadge(p);
    const title = getPropertyTitle(p);
    const image = getPropertyImage(p);
    return `
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-5 items-start">
            <img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" class="w-full md:w-28 h-28 rounded-xl object-cover">
            <div class="flex-1">
                <div class="flex flex-wrap items-center gap-3 mb-2">
                    <h3 class="font-black text-lg">${escapeHtml(title)}</h3>
                    ${renderStatusBadge(badge.text, badge.className)}
                </div>
                <p class="text-slate-400 text-sm font-bold mb-2">${escapeHtml(getPropertyCategory(p))} · ${escapeHtml(getPropertyCity(p))} · ${escapeHtml(getPropertyArea(p))} m²</p>
                <p class="text-blue-700 font-black">${escapeHtml(formatCurrency(firstDefined(p, ['price', 'amount'], 0)))}</p>
            </div>
            <div class="flex gap-2 flex-wrap">
                <a href="details.html?id=${encodeURIComponent(id)}" class="px-4 py-2 bg-slate-100 rounded-lg font-bold text-sm hover:bg-slate-200 transition">عرض</a>
                <button onclick="editPropertyVendor('${escapeAttr(id)}')" class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-100 transition">تعديل</button>
                <button onclick="deletePropertyVendor('${escapeAttr(id)}')" class="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-sm hover:bg-red-100 transition">حذف</button>
            </div>
        </div>
    `;
}

function renderUserRequestRow(booking) {
    const stat = booking.status;
    const id = booking._id;
    const statusLabel = stat === 'pending' ? 'قيد المتابعة'
        : stat === 'confirmed' ? 'تم التأكيد'
        : stat === 'cancelled' ? 'ملغي'
        : stat === 'rejected' ? 'مرفوض' : 'قيد المتابعة';
    const statusColor = stat === 'pending' ? 'bg-amber-100 text-amber-700'
        : stat === 'confirmed' ? 'bg-emerald-100 text-emerald-700'
        : stat === 'cancelled' ? 'bg-red-100 text-red-700'
        : stat === 'rejected' ? 'bg-slate-100 text-slate-600'
        : 'bg-blue-100 text-blue-700';
    const title = booking?.property?.title || firstDefined(booking, ['propertyTitle', 'title'], 'طلب عقاري');
    const date = formatDate(firstDefined(booking, ['createdAt', 'createdOn', 'date'], ''));
    return `
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
            <div class="flex-1">
                <h3 class="font-black text-lg mb-1">${escapeHtml(title)}</h3>
                <p class="text-slate-400 text-sm font-bold">${escapeHtml(date || 'بدون تاريخ')}</p>
            </div>
            <div class="flex items-center gap-2">
                ${renderStatusBadge(statusLabel, statusColor)}
                ${stat === 'pending' ? `<button onclick="cancelUserBooking('${escapeAttr(id)}')" class="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-black hover:bg-red-100 transition">إلغاء</button>` : ''}
            </div>
        </div>
    `;
}

// Navigate to sell.html in edit mode for a specific property
function editPropertyVendor(id) {
    window.location.href = 'sell.html?edit=' + encodeURIComponent(id);
}

// Delete a vendor's own property from dashboard
async function deletePropertyVendor(id) {
    if (!confirm('هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
        await apiCall(endpoint('propertyDelete', id), { method: 'DELETE' });
        alert('تم حذف العقار بنجاح');
        await loadUserDashboard();
    } catch (e) {
        alert(formatApiErrors(e.data, 'فشل حذف العقار'));
    }
}

// Cancel a user booking from dashboard
async function cancelUserBooking(bookingId) {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    try {
        await apiCall(endpoint('bookingsCancel', bookingId), { method: 'PATCH' });
        alert('تم إلغاء الطلب');
        await loadUserDashboard();
    } catch (e) {
        alert(formatApiErrors(e.data, 'فشل الإلغاء'));
    }
}

// Vendor: confirm a booking
async function vendorConfirmBooking(bookingId) {
    if (!confirm('تأكيد هذا الحجز؟')) return;
    try {
        await apiCall(endpoint('vendorBookingConfirm', bookingId), { method: 'PATCH' });
        alert('تم تأكيد الحجز');
        await loadUserDashboard();
    } catch (e) {
        alert(formatApiErrors(e.data, 'فشل التأكيد'));
    }
}

// Vendor: reject a booking
async function vendorRejectBooking(bookingId) {
    if (!confirm('رفض هذا الحجز؟')) return;
    try {
        await apiCall(endpoint('vendorBookingReject', bookingId), { method: 'PATCH' });
        alert('تم رفض الحجز');
        await loadUserDashboard();
    } catch (e) {
        alert(formatApiErrors(e.data, 'فشل الرفض'));
    }
}

function renderDashboardSaved() {
    const grid = document.getElementById('dashboard-saved-grid');
    const empty = document.getElementById('dashboard-saved-empty');
    if (!grid) return;

    if (!userDashboardState.saved.length) {
        grid.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
    }

    empty?.classList.add('hidden');
    grid.innerHTML = userDashboardState.saved.map(p => {
        const id = getPropertyId(p);
        const card = createCard(p);
        // Wrap with remove button
        return `<div class="relative group">
            ${card}
            <button onclick="dashboardRemoveFav('${escapeAttr(id)}')"
                class="absolute top-3 left-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full hidden group-hover:flex items-center justify-center text-xs font-black shadow transition z-10"
                title="إزالة من المفضلة">✕</button>
        </div>`;
    }).join('');
}

async function dashboardRemoveFav(id) {
    try {
        await apiCall(endpoint('favoriteRemove', id), { method: 'DELETE' });
        userDashboardState.saved = userDashboardState.saved.filter(p => getPropertyId(p) !== id);
        setText('userStatSaved', userDashboardState.saved.length);
        // Update local wishlist too
        const idx = wishlist.indexOf(normalizeWishlistId(id));
        if (idx > -1) { wishlist.splice(idx, 1); localStorage.setItem('property_wishlist', JSON.stringify(wishlist)); updateWishlistUI(); }
        renderDashboardSaved();
    } catch (e) {
        alert(formatApiErrors(e.data, 'فشل إزالة العقار من المفضلة'));
    }
}

function populateProfileForm(user) {
    if (!user) return;
    var nameEl = document.querySelector('#dashboard-account input[name="name"]');
    var emailEl = document.querySelector('#dashboard-account input[name="email"]');
    var phoneEl = document.querySelector('#dashboard-account input[name="phone"]');
    var roleEl = document.querySelector('#dashboard-account input[name="role"]');
    if (nameEl) nameEl.value = firstDefined(user, ['name'], '');
    if (emailEl) emailEl.value = firstDefined(user, ['email'], '');
    if (phoneEl) phoneEl.value = firstDefined(user, ['phone'], '');
    if (roleEl) roleEl.value = firstDefined(user, ['role'], 'مستخدم');
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    alert('تحديث الملف الشخصي غير متاح حالياً من خلال واجهة المستخدم.');
}

async function loadUserDashboard() {
    if (!requireLogin()) return;

    const user = await getCurrentUser(true);
    const role = (user.role || '').toLowerCase();
    const roleLabel = role === 'admin' ? '🛡️ مدير النظام'
        : role === 'vendor' ? '🏢 بائع'
        : '👤 مستخدم';
    const roleColor = role === 'admin' ? 'bg-red-100 text-red-700'
        : role === 'vendor' ? 'bg-emerald-100 text-emerald-700'
        : 'bg-blue-100 text-blue-700';

    setText('dashboardUserName', getUserDisplayName(user));
    setText('dashboardUserEmail', firstDefined(user, ['email', 'userName'], ''));

    const badge = document.getElementById('dashboardRoleBadge');
    if (badge) {
        badge.textContent = roleLabel;
        badge.className = `px-4 py-1.5 rounded-full text-xs font-black ${roleColor}`;
    }

    populateProfileForm(user);

    // Set role in account tab with translation
    const roleInput = document.querySelector('#dashboard-account input[name="role"]');
    if (roleInput) roleInput.value = roleLabel;

    // Set permissions text
    const permsEl = document.getElementById('role-permissions');
    if (permsEl) {
        const perms = role === 'admin'
            ? '🔹 إدارة جميع العقارات والمستخدمين<br>🔹 اعتماد ومراجعة العقارات<br>🔹 حذف أي محتوى'
            : role === 'vendor'
            ? '🔹 نشر وإدارة عقاراتك<br>🔹 استلام طلبات التواصل من العملاء<br>🔹 تأكيد أو رفض الحجوزات'
            : '🔹 تصفح وشراء العقارات<br>🔹 إضافة عقارات للمفضلة<br>🔹 إرسال طلبات تواصل';
        permsEl.innerHTML = perms;
    }

    // Set quick links
    const linksEl = document.getElementById('quick-links');
    if (linksEl) {
        const links = role === 'admin'
            ? '<a href="admin.html" class="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200 transition">لوحة الإدارة</a>'
            : '';
        linksEl.innerHTML = links
            + '<a href="sell.html" class="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200 transition">إضافة عقار</a>'
            + '<a href="wishlist.html" class="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200 transition">المفضلة</a>'
            + '<a href="all-properties.html" class="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200 transition">تصفح العقارات</a>';
    }

    // For vendor: use search endpoint filtered by vendor (client-side since no vendor-filter endpoint).
    // For all users: load their bookings + favorites from backend.
    const [bookingsData, favoritesData, vendorPropsData] = await Promise.all([
        tryApiGet(endpoint('bookingsMy'), { fallback: [] }),
        tryApiGet(endpoint('favorites'), { fallback: [] }),
        // Get vendor's own properties via bookings endpoint (all properties, then filter)
        (role === 'vendor' || role === 'admin')
            ? tryApiGet(endpoint('properties'), { fallback: [] })
            : Promise.resolve([])
    ]);

    const userId = user._id || user.id;
    const allProps = asArray(vendorPropsData);
    userDashboardState.properties = (role === 'vendor')
        ? allProps.filter(function(p) {
            var vendorId = (p.vendor && (p.vendor._id || p.vendor.id || p.vendor)) || '';
            return String(vendorId) === String(userId);
          })
        : (role === 'admin' ? allProps : []);
    userDashboardState.requests = asArray(bookingsData);
    userDashboardState.saved = asArray(favoritesData);

    setText('userStatProperties', userDashboardState.properties.length);
    setText('userStatPending', userDashboardState.properties.filter(function(p) { return p.status === 'available'; }).length);
    setText('userStatRequests', userDashboardState.requests.length);
    setText('userStatSaved', userDashboardState.saved.length);

    const propertiesList = document.getElementById('dashboard-properties-list');
    if (propertiesList) {
        propertiesList.innerHTML = userDashboardState.properties.length
            ? userDashboardState.properties.map(renderUserPropertyRow).join('')
            : '<div class="bg-white rounded-2xl p-10 text-center text-slate-400 font-bold border border-slate-100">لا توجد عقارات منشورة بعد.</div>';
    }

    const requestsList = document.getElementById('dashboard-requests-list');
    if (requestsList) {
        // If vendor, also fetch incoming booking requests
        if (role === 'vendor') {
            try {
                const vendorData = await tryApiGet(endpoint('vendorBookings'), { fallback: [] });
                const vendorRequests = asArray(vendorData);
                if (vendorRequests.length > 0) {
                    // Prepend vendor-specific requests with confirm/reject buttons
                    const vendorHtml = vendorRequests.map(function(b) {
                        const title = b.property?.title || firstDefined(b, ['propertyTitle', 'title'], 'طلب');
                        const clientName = b.user?.name || b.customerName || 'عميل';
                        const stat = b.status;
                        return '<div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4">'
                            + '<div class="flex-1">'
                            + '<h3 class="font-black text-lg mb-1">' + escapeHtml(title) + '</h3>'
                            + '<p class="text-slate-400 text-sm font-bold">من ' + escapeHtml(clientName) + '</p>'
                            + '</div>'
                            + (stat === 'pending'
                                ? '<div class="flex gap-2">'
                                + '<button onclick="vendorConfirmBooking(\'' + escapeAttr(b._id) + '\')" class="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition">تأكيد</button>'
                                + '<button onclick="vendorRejectBooking(\'' + escapeAttr(b._id) + '\')" class="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600 transition">رفض</button>'
                                + '</div>'
                                : renderStatusBadge(stat === 'confirmed' ? 'تم التأكيد' : stat === 'rejected' ? 'مرفوض' : stat, 'bg-slate-100 text-slate-600'))
                            + '</div>';
                    }).join('');
                    requestsList.innerHTML = vendorHtml + (userDashboardState.requests.length
                        ? '<div class="mt-6 pt-6 border-t border-slate-100"><h3 class="font-black mb-4">طلباتي المرسلة</h3>' + userDashboardState.requests.map(renderUserRequestRow).join('') + '</div>'
                        : '');
                    renderDashboardSaved();
                    switchDashboardTab(userDashboardState.currentTab);
                    return;
                }
            } catch (e) { /* no vendor bookings */ }
        }
        requestsList.innerHTML = userDashboardState.requests.length
            ? userDashboardState.requests.map(renderUserRequestRow).join('')
            : '<div class="bg-white rounded-2xl p-10 text-center text-slate-400 font-bold border border-slate-100">لا توجد طلبات حالياً.</div>';
    }

    renderDashboardSaved();
    switchDashboardTab(userDashboardState.currentTab);
}

// ============================================
// Admin Dashboard
// ============================================
let adminState = {
    currentTab: 'all',
    all: [],
    users: []
};

function switchAdminTab(tab) {
    adminState.currentTab = tab;
    ['all', 'users'].forEach(function(name) {
        var el = document.getElementById('admin-' + name);
        if (el) el.classList.toggle('hidden', name !== tab);
        var btn = document.getElementById('tab-' + name);
        if (btn) {
            btn.className = name === tab
                ? 'px-5 py-3 bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-100 transition'
                : 'px-5 py-3 bg-white text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition shadow-sm border border-slate-100';
        }
    });
}

function renderAdminPropertyCard(p, showActions) {
    const id = getPropertyId(p);
    const badge = getApprovalBadge(p);
    const title = getPropertyTitle(p);
    const desc = firstDefined(p, ['description', 'details'], '');
    const price = formatCurrency(firstDefined(p, ['price', 'amount'], 0));

    return `
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-5 items-start">
            <div class="flex-1">
                <div class="flex flex-wrap items-center gap-3 mb-2">
                    <h3 class="font-black text-lg">${escapeHtml(title)}</h3>
                    ${renderStatusBadge(badge.text, badge.className)}
                </div>
                <p class="text-slate-400 text-sm font-bold mb-2">${escapeHtml(getPropertyCategory(p))} · ${escapeHtml(getPropertyCity(p))} · ${escapeHtml(getPropertyArea(p))} m²</p>
                <p class="text-blue-700 font-black text-xl">${escapeHtml(price)}</p>
                <p class="text-slate-500 text-sm mt-2 line-clamp-2">${escapeHtml(desc)}</p>
            </div>
            <div class="flex flex-wrap gap-2">
                <a href="details.html?id=${encodeURIComponent(id)}" class="px-4 py-2 bg-slate-100 rounded-lg font-bold text-sm hover:bg-slate-200 transition">عرض</a>
                <a href="sell.html?id=${encodeURIComponent(id)}" class="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition">تعديل</a>
                ${showActions ? `
                    <button onclick='approveProperty(${jsArg(id)}, 1)' class="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600 transition">اعتماد بيع</button>
                    <button onclick='approveProperty(${jsArg(id)}, 2)' class="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition">اعتماد إيجار</button>
                ` : (!isPropertyApproved(p) ? `<button onclick='approveProperty(${jsArg(id)}, 1)' class="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600 transition">اعتماد</button>` : '')}
                <button onclick='deleteProperty(${jsArg(id)})' class="px-4 py-2 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 transition">حذف</button>
            </div>
        </div>
    `;
}

function renderAdminUserRow(user) {
    const name = getUserDisplayName(user);
    const email = firstDefined(user, ['email', 'userName'], '');
    const roles = getUserRoles(user).join(', ') || 'user';
    const created = formatDate(firstDefined(user, ['createdAt', 'createdOn'], ''));
    return `
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
            <div class="flex-1">
                <h3 class="font-black text-lg">${escapeHtml(name)}</h3>
                <p class="text-slate-400 text-sm font-bold">${escapeHtml(email)}</p>
            </div>
            <div class="text-sm font-bold text-slate-500">${escapeHtml(created)}</div>
            ${renderStatusBadge(roles, isAdminUser(user) ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600')}
            <button onclick="deleteUser('${user._id}')" class="px-4 py-2 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 transition">حذف</button>
        </div>
    `;
}

function renderAdminRequestRow(request) {
    const title = request?.property?.title || firstDefined(request, ['propertyTitle', 'title'], 'طلب عقاري');
    const user = request?.user || {};
    const name = getUserDisplayName(user) || firstDefined(request, ['customerName', 'name'], 'عميل');
    const status = firstDefined(request, ['status', 'statusName'], 'قيد المتابعة');
    return `
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
            <div class="flex-1">
                <h3 class="font-black text-lg">${escapeHtml(title)}</h3>
                <p class="text-slate-400 text-sm font-bold">${escapeHtml(name)} · ${escapeHtml(formatDate(firstDefined(request, ['createdAt', 'createdOn', 'date'], '')))}</p>
            </div>
            ${renderStatusBadge(status, 'bg-amber-100 text-amber-700')}
        </div>
    `;
}

function renderAdminLists() {
    const allGrid = document.getElementById('allGrid');
    if (allGrid) {
        allGrid.innerHTML = adminState.all.length
            ? adminState.all.map(function(p) { return renderAdminPropertyCard(p, false); }).join('')
            : '<div class="bg-white rounded-2xl p-10 text-center text-slate-400 font-bold border border-slate-100">لا توجد عقارات بعد.</div>';
    }

    const usersGrid = document.getElementById('usersGrid');
    if (usersGrid) {
        usersGrid.innerHTML = adminState.users.length
            ? adminState.users.map(renderAdminUserRow).join('')
            : '<div class="bg-white rounded-2xl p-10 text-center text-slate-400 font-bold border border-slate-100">لا يوجد مستخدمون.</div>';
    }
}

async function loadAdminDashboard() {
    if (!requireLogin()) return;
    const user = await getCurrentUser(true);
    setText('adminName', getUserDisplayName(user));

    try {
        const [dashboardData, propertiesData, usersData] = await Promise.all([
            tryApiGet(endpoint('adminDashboard'), { throwAuth: true, fallback: null }),
            tryApiGet(endpoint('adminProperties'), { fallback: [] }),
            tryApiGet(endpoint('adminUsers'), { fallback: [] })
        ]);

        adminState.all = asArray(propertiesData);
        adminState.users = asArray(usersData);

        if (dashboardData) {
            setText('statTotal', dashboardData.properties ? dashboardData.properties.total : adminState.all.length);
            setText('statPending', dashboardData.properties ? dashboardData.properties.available : 0);
            setText('statUsers', dashboardData.users ? dashboardData.users.total : adminState.users.length);
            setText('statRequests', dashboardData.bookings ? dashboardData.bookings.pending : 0);
        }

        renderAdminLists();
        switchAdminTab('all');
    } catch (e) {
        if (e.status === 401 || e.status === 403) {
            alert('تحتاج صلاحيات أدمن للدخول');
            window.location.href = 'dashboard.html';
        } else {
            console.error('Admin dashboard failed:', e);
        }
    }
}

async function approveProperty(id, status) {
    try {
        const listingType = status === 2 ? 'rent' : 'sale';
        const data = await apiCall(endpoint('propertyUpdate', id), {
            method: 'PUT',
            body: JSON.stringify({ listingType: listingType, status: 'available' })
        });
        alert(data.message || 'تم التحديث بنجاح');
        await loadAdminDashboard();
    } catch (e) {
        alert(formatApiErrors(e.data, 'فشل التحديث'));
    }
}

async function deleteProperty(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
        await apiCall(endpoint('propertyDelete', id), { method: 'DELETE' });
        alert('تم الحذف');
        await loadAdminDashboard();
    } catch (e) {
        alert(formatApiErrors(e.data, 'فشل الحذف'));
    }
}

async function deleteUser(userId) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(API_BASE + '/admin/users/' + userId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) {
            const err = await res.json();
            throw err;
        }
        alert('تم حذف المستخدم');
        await loadAdminDashboard();
    } catch (e) {
        alert(formatApiErrors(e?.data || e, 'فشل الحذف'));
    }
}

// ============================================
// Sell Page – Edit Mode
// ============================================
async function loadSellEditMode(id) {
    try {
        const data = await apiCall(endpoint('propertyDetails', id));
        const p = data.property || data;

        const form = document.getElementById('sellForm');
        if (!form) return;

        // Update page title/button
        const heading = form.closest('div')?.querySelector('h3');
        if (heading) heading.textContent = 'تعديل بيانات العقار';
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.textContent = 'حفظ التعديلات';

        // Fill in fields
        const set = (name, val) => {
            const el = form.querySelector(`[name="${name}"]`);
            if (el) el.value = val ?? '';
        };

        set('title', p.title);
        set('price', p.price);
        set('rooms', p.rooms);
        set('bathrooms', p.bathrooms);
        set('area', p.area);
        set('description', p.description);
        set('location', p.location);
        set('type', p.type);
        set('listingType', p.listingType);
        set('status', p.status);
        set('nearbyServices', Array.isArray(p.nearbyServices) ? p.nearbyServices.join(', ') : (p.nearbyServices || ''));

        // Show current images preview
        const images = getPropertyImages(p);
        const previewContainer = document.getElementById('current-images-preview');
        if (previewContainer && images.length > 0) {
            previewContainer.innerHTML = `
                <p class="text-xs text-slate-400 mb-2 font-bold">الصور الحالية (${images.length}):</p>
                <div class="flex gap-2 flex-wrap">
                    ${images.map(url => `<img src="${escapeAttr(url)}" class="w-16 h-16 object-cover rounded-xl border border-slate-200">`).join('')}
                </div>
                <p class="text-xs text-slate-400 mt-2 font-bold">رفع صور جديدة سيستبدل الصور الحالية</p>
            `;
            previewContainer.classList.remove('hidden');
        }
    } catch (e) {
        alert('فشل تحميل بيانات العقار للتعديل');
        console.error(e);
    }
}

// ============================================
// Init on page load
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    updateAuthNav();
    await syncWishlistFromBackend();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const signupForm = document.getElementById('signupForm');
    if (signupForm) signupForm.addEventListener('submit', handleSignup);

    if (document.getElementById('grid-all') || document.getElementById('grid-visited')) {
        await renderGrids();
        renderLocationCards();
    }

    if (document.getElementById('grid-all-properties')) {
        // all-properties.html uses backend search - fetchAndRender is called by inline script
    }

    if (document.getElementById('wishlist-grid')) {
        // wishlist.html handles its own DOMContentLoaded with renderWishlist
    }

    if (window.location.pathname.includes('details.html')) {
        await loadPropertyDetails();
        // Show review form only for logged-in users
        const reviewForm = document.getElementById('review-form-container');
        if (reviewForm) reviewForm.classList.toggle('hidden', !isLoggedIn());
    }

    if (document.getElementById('userDashboardApp')) {
        await loadUserDashboard();
    }

    if (document.getElementById('adminDashboardApp')) {
        await loadAdminDashboard();
    }

    // Sell page: load edit mode if ?edit=ID is in URL
    if (document.getElementById('sellForm')) {
        const editId = new URLSearchParams(window.location.search).get('edit');
        if (editId) loadSellEditMode(editId);
    }

    updateWishlistUI();
});
