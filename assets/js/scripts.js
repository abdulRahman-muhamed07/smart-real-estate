const apiKey = ""; // API Key provided by system
const modelName = "gemini-2.5-flash-preview-09-2025";

// Gemini API Wrapper
async function callGemini(prompt, system = "", search = false) {
    if (!apiKey) {
        console.warn("No API Key provided. Using mock response for demonstration.");
        await new Promise(r => setTimeout(r, 1500)); // Simulate delay
        if (prompt.includes("أسعار")) {
            return "بناءً على السوق الحالي في التجمع الخامس، تبدأ أسعار الشقق من 25,000 جنيه للمتر في المناطق المتوسطة، وتصل إلى 45,000 جنيه للمتر في الكمبوندات الفاخرة مثل مدينتي وسيتى جيت.";
        }
        return "هذا رد تجريبي (Mock Response) لأن مفتاح API غير مضبوط. بمجرد إضافة المفتاح، سأقوم بتحليل طلبك بدقة باستخدام Gemini AI.";
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        ...(search && { tools: [{ "google_search": {} }] })
    };

    for (let i = 0; i < 5; i++) {
        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، حدث خطأ.";
        } catch (e) {
            await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        }
    }
    return "فشل الاتصال بالذكاء الاصطناعي.";
}

// Valuation Handler
async function handleValuation() {
    const type = document.getElementById('val-type').value;
    const area = document.getElementById('val-area').value;
    const resDiv = document.getElementById('val-result');
    if (!area) return;

    resDiv.innerHTML = "✨ جاري التقييم بواسطة AI...";
    resDiv.classList.remove('hidden');

    const prompt = `أعطني تقييم سعري تقريبي بالجنيه المصري لعقار من نوع ${type} بمساحة ${area} متر مربع في منطقة راقية بالقاهرة. اذكر نطاق السعر و3 نقاط سريعة تبرر التقييم.`;
    const system = "أنت خبير تثمين عقاري مصري محترف. رد باللغة العربية بأسلوب جذاب ومختصر.";

    const response = await callGemini(prompt, system);
    resDiv.innerHTML = `<strong>✨ التقرير المقترح:</strong><br>${response.replace(/\n/g, '<br>')}`;
}

// Property Rendering Data
const propertyList = [
    { id: 1, price: '32,000 ج.م/شهر', type: 'For Rent', title: 'شقة فاخرة للإيجار', beds: 4, baths: 3, sqft: '280', loc: 'التجمع الخامس، القاهرة', match: '92%', rating: 4.8, img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800' },
    { id: 2, price: '8,500,000 ج.م', type: 'For Sale', title: 'بنتهاوس عصري', beds: 3, baths: 2, sqft: '210', loc: 'الشيخ زايد، الجيزة', match: '95%', rating: 4.9, img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800' },
    { id: 3, price: '12,000,000 ج.م', type: 'For Sale', title: 'فيلا مستقلة بحديقة', beds: 4, baths: 3, sqft: '350', loc: 'مدينتي، القاهرة', match: '89%', rating: 4.7, img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800' },
    { id: 4, price: '15,000 ج.م/شهر', type: 'For Rent', title: 'شقة استوديو أنيقة', beds: 1, baths: 1, sqft: '90', loc: 'المعادي، القاهرة', match: '88%', rating: 4.5, img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800' },
    { id: 5, price: '2,500,000 ج.م', type: 'For Sale', title: 'شقة سكنية ممتازة', beds: 3, baths: 2, sqft: '160', loc: 'مدينة نصر، القاهرة', match: '91%', rating: 4.6, img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800' }
];

const properties = propertyList; // For compatibility with different pages

// --- Wishlist Logic ---
let wishlist = JSON.parse(localStorage.getItem('property_wishlist')) || [];

function toggleWishlist(id) {
    const index = wishlist.indexOf(id);
    if (index === -1) {
        wishlist.push(id);
    } else {
        wishlist.splice(index, 1);
    }
    localStorage.setItem('property_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
}

function updateWishlistUI() {
    // Update all counters
    const counters = document.querySelectorAll('.wishlist-counter');
    counters.forEach(c => {
        c.innerText = wishlist.length;
        c.classList.toggle('hidden', wishlist.length === 0);
    });

    // Update all heart buttons
    const buttons = document.querySelectorAll('.wishlist-btn');
    buttons.forEach(btn => {
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

    // If we are on the wishlist page, we might need a re-render
    if (window.location.pathname.includes('wishlist.html')) {
        renderWishlist();
    }
}

// Ensure UI is updated on load
document.addEventListener('DOMContentLoaded', updateWishlistUI);
// ----------------------

function createCard(p) {
    const isSaved = wishlist.includes(p.id);
    return `
        <div class="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group border border-slate-100 animate-section relative">
            <button onclick="event.preventDefault(); toggleWishlist(${p.id})" 
                    class="wishlist-btn absolute top-6 left-6 z-10 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all cursor-pointer" 
                    data-id="${p.id}">
                <span class="heart-icon text-xl">${isSaved ? '❤️' : '🤍'}</span>
            </button>
            <a href="details.html?id=${p.id}" class="block relative h-72 overflow-hidden">
                <img src="${p.img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute top-6 right-6 flex gap-2">
                    <span class="bg-white/90 backdrop-blur-md text-blue-700 px-4 py-1.5 rounded-full text-xs font-black shadow-sm">${p.type === 'For Sale' ? 'للبيع' : 'للإيجار'}</span>
                    <span class="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-sm">${p.match} Match</span>
                </div>
            </a>
            <div class="p-8">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="font-black text-xl mb-1 group-hover:text-blue-700 transition">${p.title}</h4>
                        <p class="text-slate-400 text-xs font-bold">📍 ${p.loc}</p>
                    </div>
                    <div class="text-blue-700 font-black text-lg">${p.price}</div>
                </div>
                
                <div class="flex gap-6 py-6 border-y border-slate-50 mb-6">
                    <div class="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">🛏️ ${p.beds} Beds</div>
                    <div class="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">🚿 ${p.baths} Baths</div>
                    <div class="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">📏 ${p.sqft} m²</div>
                </div>

                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-1">
                        <span class="text-yellow-400">★</span>
                        <span class="font-black text-sm">${p.rating}</span>
                    </div>
                    <a href="details.html?id=${p.id}" class="font-black text-blue-700 hover:gap-3 flex items-center gap-2 transition-all">التفاصيل <span>←</span></a>
                </div>
            </div>
        </div>
    `;
}

const locationList = [
    { name: 'القاهرة الجديدة', title: 'أفضل الوجهات للسكن', img: 'https://images.unsplash.com/photo-1582408921715-18e7806367c1?auto=format&fit=crop&w=800' },
    { name: 'التجمع الخامس', title: 'إطلالات خلابة وحدائق', img: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800' },
    { name: 'مدينة الشروق', title: 'هدوء وخصوصية تامة', img: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800' }
];

function createLocationCard(l) {
    return `
        <div class="group cursor-pointer">
            <div class="relative overflow-hidden rounded-[2.5rem] h-80 mb-6 shadow-lg">
                <img src="${l.img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 text-white">
                    <h4 class="font-black text-xl mb-1">${l.name}</h4>
                    <p class="text-sm text-white/70">${l.title}</p>
                </div>
            </div>
        </div>
    `;
}

function renderGrids() {
    const allGrid = document.getElementById('grid-all');
    const visitedGrid = document.getElementById('grid-visited');
    const locGrid = document.getElementById('grid-locations');

    if (allGrid && visitedGrid) {
        propertyList.forEach(p => {
            allGrid.innerHTML += createCard(p);
            visitedGrid.innerHTML += createCard({ ...p, match: (parseInt(p.match) - 5) + '%' });
        });
    }

    if (locGrid) {
        locationList.forEach(l => {
            locGrid.innerHTML += `
            <div class="relative overflow-hidden rounded-[2.5rem] h-80 group cursor-pointer shadow-lg border border-white">
                <img src="${l.img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end text-white">
                    <h4 class="text-2xl font-black mb-1">${l.name}</h4>
                    <p class="text-white/70 font-bold mb-4">${l.title}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-xs bg-lime-400 text-black px-3 py-1 rounded-lg font-black">92% AI Match</span>
                        <span class="text-white/60 font-bold text-xs">Brooklyn, NY</span>
                    </div>
                </div>
            </div>
            `;
        });
    }
}

// Chatbot UI
function toggleChat() {
    const m = document.getElementById('ai-chat-modal');
    if (m) {
        m.classList.toggle('hidden');
        m.classList.toggle('flex');
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const box = document.getElementById('chat-messages');
    if (!input || !box) return;
    const txt = input.value.trim();
    if (!txt) return;

    box.innerHTML += `<div class="bg-blue-100 p-5 rounded-2xl shadow-sm self-end text-right ml-auto max-w-[85%] font-bold text-blue-900 animate-section">${txt}</div>`;
    input.value = "";
    box.scrollTop = box.scrollHeight;

    const aiPlaceholder = document.createElement('div');
    aiPlaceholder.className = "bg-white p-5 rounded-2xl shadow-sm border border-slate-100 max-w-[85%] italic text-slate-400 font-bold animate-pulse";
    aiPlaceholder.innerText = "جاري التفكير...";
    box.appendChild(aiPlaceholder);

    const system = "أنت مساعد ذكي لمنصة 'العقار الذكي' في مصر. وظيفتك مساعدة المستخدمين في فهم سوق العقارات، أسعار المناطق، والنصائح القانونية. استخدم بحث جوجل للتحقق من المعلومات الحالية.";
    const response = await callGemini(txt, system, true);

    aiPlaceholder.classList.remove('animate-pulse', 'italic', 'text-slate-400');
    aiPlaceholder.className = "bg-white p-5 rounded-2xl shadow-sm border border-slate-100 max-w-[85%] font-bold text-slate-700 animate-section";
    aiPlaceholder.innerText = response;
    box.scrollTop = box.scrollHeight;
}
