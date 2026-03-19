// ============================================
// API Configuration
// ============================================
const API_BASE = '/api';

// ============================================
// Auth Helpers
// ============================================
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

async function apiCall(endpoint, options = {}) {
    const defaults = {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    };
    const res = await fetch(API_BASE + endpoint, { ...defaults, ...options });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch(e) { data = {}; }
    if (!res.ok) throw { status: res.status, data };
    return data;
}

async function apiCallForm(endpoint, formData) {
    const res = await fetch(API_BASE + endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include'
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch(e) { data = {}; }
    if (!res.ok) throw { status: res.status, data };
    return data;
}

// Check if user is logged in
function isLoggedIn() {
    if (localStorage.getItem('isLoggedIn') === 'true') return true;
    return document.cookie.includes('.AspNetCore.Identity.Application=');
}

function setLoggedIn(val) {
    localStorage.setItem('isLoggedIn', val ? 'true' : 'false');
}

// ============================================
// Property Helpers
// ============================================
function getPriceValue(price) {
    return Number(price) || 0;
}

// ============================================
// Gemini AI (unchanged)
// ============================================
const apiKey = '';
const modelName = 'gemini-2.5-flash-preview-09-2025';

async function callGemini(prompt, system = '', search = false) {
    if (!apiKey) {
        await new Promise(r => setTimeout(r, 1500));
        if (prompt.includes('أسعار')) {
            return 'بناءً على السوق الحالي في التجمع الخامس، تبدأ أسعار الشقق من 25,000 جنيه للمتر في المناطق المتوسطة، وتصل إلى 45,000 جنيه للمتر في الكمبوندات الفاخرة.';
        }
        return 'هذا رد تجريبي (Mock Response) لأن مفتاح API غير مضبوط.';
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        ...(search && { tools: [{ google_search: {} }] })
    };
    for (let i = 0; i < 5; i++) {
        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، حدث خطأ.';
        } catch (e) {
            await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        }
    }
    return 'فشل الاتصال بالذكاء الاصطناعي.';
}

async function handleValuation() {
    const type = document.getElementById('val-type')?.value;
    const area = document.getElementById('val-area')?.value;
    const resDiv = document.getElementById('val-result');
    if (!area || !resDiv) return;
    resDiv.innerHTML = '✨ جاري التقييم بواسطة AI...';
    resDiv.classList.remove('hidden');
    const prompt = `أعطني تقييم سعري تقريبي بالجنيه المصري لعقار من نوع ${type} بمساحة ${area} متر مربع في منطقة راقية بالقاهرة.`;
    const system = 'أنت خبير تثمين عقاري مصري محترف. رد باللغة العربية.';
    const response = await callGemini(prompt, system);
    resDiv.innerHTML = `<strong>✨ التقرير المقترح:</strong><br>${response.replace(/\n/g, '<br>')}`;
}

// ============================================
// Mobile Menu
// ============================================
function toggleMobileMenu() {
    const nav = document.getElementById('mobile-nav');
    if (nav) nav.classList.toggle('hidden');
}

// ============================================
// Logout
// ============================================
async function logout() {
    try { await apiCall('/account/logout', { method: 'POST' }); } catch(e) {}
    setLoggedIn(false);
    window.location.href = 'login.html';
}

// ============================================
// Auth-Aware Navigation
// ============================================
function updateAuthNav() {
    const loggedIn = isLoggedIn();
    document.querySelectorAll('.nav-auth-logged-in').forEach(el => {
        el.style.display = loggedIn ? '' : 'none';
    });
    document.querySelectorAll('.nav-auth-logged-out').forEach(el => {
        el.style.display = loggedIn ? 'none' : '';
    });
}

// ============================================
// Property Cards (from API)
// ============================================
function getStatusLabel(p) {
    if (p.isForRent) return 'للإيجار';
    return 'للبيع';
}

function createCard(p) {
    const img = p.imageUrl || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800';
    const cat = p.category?.name || 'عقار';
    const city = p.city?.name || '';
    const price = p.price ? Number(p.price).toLocaleString() + ' ج.م' : '';
    const rooms = p.bedrooms || 0;
    const area = p.area || 0;
    const label = getStatusLabel(p);

    return `
        <div class="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group border border-slate-100 animate-section">
            <a href="details.html?id=${p.id}" class="block relative h-72 overflow-hidden">
                <img src="${img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute top-6 right-6 flex gap-2">
                    <span class="bg-white/90 backdrop-blur-md text-blue-700 px-4 py-1.5 rounded-full text-xs font-black shadow-sm">${label}</span>
                    <span class="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black shadow-sm">${cat}</span>
                </div>
            </a>
            <div class="p-8">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="font-black text-xl mb-1 group-hover:text-blue-700 transition">${p.title}</h4>
                        <p class="text-slate-400 text-xs font-bold">📍 ${city}</p>
                    </div>
                    <div class="text-blue-700 font-black text-lg">${price}</div>
                </div>
                <div class="flex gap-6 py-6 border-y border-slate-50 mb-6">
                    <div class="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">🛏️ ${rooms} Beds</div>
                    <div class="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">📏 ${area} m²</div>
                </div>
                <a href="details.html?id=${p.id}" class="font-black text-blue-700 hover:gap-3 flex items-center gap-2 transition-all">التفاصيل <span>←</span></a>
            </div>
        </div>
    `;
}

// ============================================
// Load Properties from API
// ============================================
let properties = [];
let propertiesLoaded = false;

async function loadProperties() {
    if (propertiesLoaded && properties.length > 0) return properties;
    try {
        const data = await apiCall('/property/all?pageSize=50');
        properties = data.data || data || [];
        propertiesLoaded = true;
        return properties;
    } catch (e) {
        console.error('Failed to load properties:', e);
        return [];
    }
}

async function renderGrids() {
    const allGrid = document.getElementById('grid-all');
    const visitedGrid = document.getElementById('grid-visited');

    const props = await loadProperties();

    if (allGrid) {
        if (props.length === 0) {
            allGrid.innerHTML = '<p class="text-center text-slate-400 col-span-3 py-12 font-bold">لا توجد عقارات حالياً. تحقق لاحقاً!</p>';
        } else {
            props.forEach(p => { allGrid.innerHTML += createCard(p); });
        }
    }

    if (visitedGrid) {
        props.slice(0, 6).forEach(p => { visitedGrid.innerHTML += createCard(p); });
    }
}

// ============================================
// Property Details (from API)
// ============================================
async function loadPropertyDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    try {
        const p = await apiCall('/property/GetById/' + id);
        const img = p.imageUrl || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800';

        document.getElementById('prop-img').src = img;
        document.getElementById('prop-title').textContent = p.title;
        document.getElementById('prop-price').textContent = p.price ? Number(p.price).toLocaleString() + ' ج.م' : '';
        document.getElementById('prop-location').textContent = p.city?.name || '';
        document.getElementById('prop-description').textContent = p.description || '';
        document.getElementById('prop-area').textContent = p.area ? p.area + ' m²' : '';
        document.getElementById('prop-rooms').textContent = p.bedrooms || 0;
        document.getElementById('prop-category').textContent = p.category?.name || '';
    } catch (e) {
        console.error('Failed to load property:', e);
    }
}

// ============================================
// Login
// ============================================
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const rememberMe = document.getElementById('loginRemember')?.checked || false;
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');

    if (!email || !password) {
        if (errEl) { errEl.textContent = 'يرجى ملء جميع الحقول'; errEl.classList.remove('hidden'); }
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '⏳ جاري تسجيل الدخول...';
    if (errEl) errEl.classList.add('hidden');

    try {
        const data = await apiCall('/account/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, rememberMe })
        });
        setLoggedIn(true);
        window.location.href = 'home.html';
    } catch (e) {
        if (errEl) { errEl.textContent = e.data?.message || 'فشل تسجيل الدخول'; errEl.classList.remove('hidden'); }
        btn.disabled = false;
        btn.innerHTML = 'تسجيل الدخول';
    }
}

// ============================================
// Signup
// ============================================
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
    btn.innerHTML = '⏳ جاري إنشاء الحساب...';

    try {
        const data = await apiCall('/account/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, firstName, lastName, isCompany: false })
        });
        alert(data.message || 'تم إنشاء الحساب بنجاح');
        window.location.href = 'login.html';
    } catch (e) {
        const msgs = Array.isArray(e.data) ? e.data.map(d => d.description).join('\n') : (e.data?.message || 'فشل إنشاء الحساب');
        alert(msgs);
        btn.disabled = false;
        btn.innerHTML = 'انشاء حساب';
    }
}

// ============================================
// Sell Form
// ============================================
async function handleSellForm(event) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');

    if (!isLoggedIn()) {
        alert('يجب تسجيل الدخول أولاً');
        window.location.href = 'login.html';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '⏳ جاري الإرسال...';

    try {
        const formData = new FormData(form);
        // Debug: log what we're sending
        for (let [key, val] of formData.entries()) {
            console.log('SELL FIELD:', key, val instanceof File ? val.name : val);
        }
        const data = await apiCallForm('/property/add', formData);
        alert('تم إرسال طلبك بنجاح!');
        form.reset();
        btn.innerHTML = '✅ تم الإرسال';
        btn.classList.add('bg-green-600');
    } catch (e) {
        console.error('SELL ERROR:', JSON.stringify(e.data));
        let errMsg = e.data?.message || e.data?.title || 'فشل الإرسال';
        if (e.data?.errors) {
            const fieldErrors = Object.entries(e.data.errors).map(([k,v]) => k + ': ' + v.join(', ')).join('
');
            errMsg += '

' + fieldErrors;
        }
        alert(errMsg);
        btn.disabled = false;
        btn.innerHTML = 'نشر الإعلان';
    }
}

// ============================================
// Wishlist (localStorage for now)
// ============================================
let wishlist = JSON.parse(localStorage.getItem('property_wishlist')) || [];

function toggleWishlist(id) {
    const index = wishlist.indexOf(id);
    if (index === -1) wishlist.push(id); else wishlist.splice(index, 1);
    localStorage.setItem('property_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
}

function updateWishlistUI() {
    document.querySelectorAll('.wishlist-counter').forEach(c => {
        c.innerText = wishlist.length;
        c.classList.toggle('hidden', wishlist.length === 0);
    });
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const id = parseInt(btn.dataset.id);
        const icon = btn.querySelector('.heart-icon');
        if (wishlist.includes(id)) {
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
// Buy Now
// ============================================
function handleBuyNow() {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl';
    overlay.innerHTML = `
        <div class="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl">
            <div class="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl animate-bounce">✓</div>
            <h2 class="text-4xl font-black mb-4">تهانينا! 🎉</h2>
            <p class="text-slate-500 font-bold text-lg mb-8">سيقوم مستشارنا العقاري بالتواصل معك خلال 30 دقيقة.</p>
            <button onclick="this.closest('.fixed').remove()" class="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-slate-800 transition-all">حسناً</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

// ============================================
// Chat
// ============================================
function toggleChat() {
    const m = document.getElementById('ai-chat-modal');
    if (m) { m.classList.toggle('hidden'); m.classList.toggle('flex'); }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const box = document.getElementById('chat-messages');
    if (!input || !box) return;
    const txt = input.value.trim();
    if (!txt) return;

    box.innerHTML += `<div class="bg-blue-100 p-5 rounded-2xl shadow-sm self-end text-right ml-auto max-w-[85%] font-bold text-blue-900">${txt}</div>`;
    input.value = '';
    box.scrollTop = box.scrollHeight;

    const aiPlaceholder = document.createElement('div');
    aiPlaceholder.className = 'bg-white p-5 rounded-2xl shadow-sm border border-slate-100 max-w-[85%] italic text-slate-400 font-bold animate-pulse';
    aiPlaceholder.innerText = 'جاري التفكير...';
    box.appendChild(aiPlaceholder);

    const system = 'أنت مساعد ذكي لمنصة العقار الذكي في مصر.';
    const response = await callGemini(txt, system, true);

    aiPlaceholder.classList.remove('animate-pulse', 'italic', 'text-slate-400');
    aiPlaceholder.className = 'bg-white p-5 rounded-2xl shadow-sm border border-slate-100 max-w-[85%] font-bold text-slate-700';
    aiPlaceholder.innerText = response;
    box.scrollTop = box.scrollHeight;
}

// ============================================
// Sort Helper
// ============================================
function sortProperties(list, criteria) {
    const sorted = [...list];
    switch (criteria) {
        case 'price-low': return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        case 'price-high': return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        case 'newest': default: return sorted.sort((a, b) => b.id - a.id);
    }
}

// ============================================
// Location Cards (static)
// ============================================
const locationList = [
    { name: 'القاهرة الجديدة', title: 'أفضل الوجهات للسكن', img: 'https://images.unsplash.com/photo-1582408921715-18e7806367c1?auto=format&fit=crop&w=800' },
    { name: 'التجمع الخامس', title: 'إطلالات خلابة وحدائق', img: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800' },
    { name: 'مدينة الشروق', title: 'هدوء وخصوصية تامة', img: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800' }
];

function renderLocationCards() {
    const locGrid = document.getElementById('grid-locations');
    if (!locGrid) return;
    locationList.forEach(l => {
        locGrid.innerHTML += `
            <div class="relative overflow-hidden rounded-[2.5rem] h-80 group cursor-pointer shadow-lg border border-white">
                <img src="${l.img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end text-white">
                    <h4 class="text-2xl font-black mb-1">${l.name}</h4>
                    <p class="text-white/70 font-bold mb-4">${l.title}</p>
                </div>
            </div>
        `;
    });
}

// ============================================
// Init on page load
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Update auth-aware nav on every page
    updateAuthNav();

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) signupForm.addEventListener('submit', handleSignup);

    // Home page
    if (document.getElementById('grid-all') || document.getElementById('grid-visited')) {
        await renderGrids();
        renderLocationCards();
    }

    // All properties page
    if (document.getElementById('grid-all-properties')) {
        await loadProperties();
        if (typeof renderFiltered === 'function') renderFiltered();
    }

    // Wishlist page
    if (document.getElementById('wishlist-grid')) {
        await loadProperties();
        if (typeof renderWishlist === 'function') renderWishlist();
    }

    // Details page
    if (window.location.pathname.includes('details.html')) {
        loadPropertyDetails();
    }

    updateWishlistUI();
});
