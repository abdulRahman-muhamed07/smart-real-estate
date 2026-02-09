const apiKey = ""; // API Key provided by system
const modelName = "gemini-2.5-flash-preview-09-2025";

// Gemini API Wrapper
async function callGemini(prompt, system = "", search = false) {
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
    { id: 1, price: '$3,200/mo', type: 'For Rent', title: 'Smart Family Home', beds: 4, baths: 3, sqft: '2,800', loc: 'Cairo, Egypt', match: '92%', rating: 4.8, img: 'https://images.unsplash.com/photo-1600585154340-be6199f7d009?auto=format&fit=crop&w=800' },
    { id: 2, price: '$850,000', type: 'For Sale', title: 'Modern Penthouse', beds: 3, baths: 2, sqft: '2,100', loc: 'Zayed, Egypt', match: '95%', rating: 4.9, img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800' },
    { id: 3, price: '$1,200,000', type: 'For Sale', title: 'Luxury City Condo', beds: 2, baths: 2, sqft: '1,800', loc: 'Fifth Settlement', match: '89%', rating: 4.7, img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800' }
];

const locationList = [
    { name: 'القاهرة الجديدة', title: 'Smart Family Home', img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800' },
    { name: 'التجمع الخامس', title: 'Modern Penthouse', img: 'https://images.unsplash.com/photo-1536376074432-bf12406b43e3?auto=format&fit=crop&w=800' },
    { name: 'مدينة الشروق', title: 'Luxury City Condo', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800' }
];

function createCard(p) {
    return `
    <div class="property-card bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl overflow-hidden border border-slate-100 transition-all duration-500 group cursor-pointer">
        <div class="relative h-64 overflow-hidden">
            <img src="${p.img}" class="w-full h-full object-cover transition-transform duration-700">
            <span class="absolute top-5 right-5 bg-white/90 backdrop-blur px-4 py-1.5 rounded-xl text-xs font-black shadow-sm ${p.type === 'For Rent' ? 'text-blue-600' : 'text-green-600'}">${p.type}</span>
            <div class="absolute bottom-5 left-5 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                <span class="text-yellow-400 text-sm">⭐</span> <span class="font-black text-xs">${p.rating}</span>
            </div>
        </div>
        <div class="p-8">
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-2xl font-black text-purple-700">${p.price}</h4>
                <div class="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">${p.match} AI Match</div>
            </div>
            <h3 class="font-black text-lg mb-3 text-slate-800">${p.title}</h3>
            <div class="flex items-center gap-4 text-slate-400 font-bold text-xs mb-6">
                <span>🛏️ ${p.beds} Beds</span>
                <span>🚿 ${p.baths} Baths</span>
                <span>📐 ${p.sqft} sqft</span>
            </div>
            <div class="pt-6 border-t border-slate-50 flex items-center justify-between text-slate-400 text-xs font-bold">
                <span class="flex items-center gap-1">📍 ${p.loc}</span>
                <button class="text-purple-600 font-black hover:underline transition">التفاصيل ←</button>
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
            visitedGrid.innerHTML += createCard({...p, match: (parseInt(p.match)-5)+'%'});
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

    box.innerHTML += `<div class="bg-purple-100 p-5 rounded-2xl shadow-sm self-end text-right ml-auto max-w-[85%] font-bold text-purple-900 animate-section">${txt}</div>`;
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
