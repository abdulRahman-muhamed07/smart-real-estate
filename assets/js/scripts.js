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
    { id: 2, price: '8,500,000 ج.م', type: 'For Sale', title: 'بنتهاوس عصري', beds: 3, baths: 2, sqft: '210', loc: 'الشيخ زايد، الجيزة', match: '95%', rating: 4.9, img: 'https://images.unsplash.com/photo-1600585154340-be6199f7d009?auto=format&fit=crop&w=800' },
    { id: 3, price: '12,000,000 ج.م', type: 'For Sale', title: 'فيلا مستقلة بحديقة', beds: 4, baths: 3, sqft: '350', loc: 'مدينتي، القاهرة', match: '89%', rating: 4.7, img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800' },
    { id: 4, price: '15,000 ج.م/شهر', type: 'For Rent', title: 'شقة استوديو أنيقة', beds: 1, baths: 1, sqft: '90', loc: 'المعادي، القاهرة', match: '88%', rating: 4.5, img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800' },
    { id: 5, price: '2,500,000 ج.م', type: 'For Sale', title: 'شقة سكنية ممتازة', beds: 3, baths: 2, sqft: '160', loc: 'مدينة نصر، القاهرة', match: '91%', rating: 4.6, img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800' }
];

const properties = propertyList; // For compatibility with different pages

const locationList = [
    { name: 'القاهرة الجديدة', title: 'أفضل الوجهات للسكن', img: 'https://images.unsplash.com/photo-1582408921715-18e7806367c1?auto=format&fit=crop&w=800' },
    { name: 'التجمع الخامس', title: 'إطلالات خلابة وحدائق', img: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800' },
    { name: 'مدينة الشروق', title: 'هدوء وخصوصية تامة', img: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800' }
];

function createCard(p) {
    return `
    <div class="property-card bg-white rounded-3xl shadow-sm hover:shadow-2xl overflow-hidden border border-slate-100 transition-all duration-500 group cursor-pointer">
        <div class="relative h-64 overflow-hidden">
            <img src="${p.img}" class="w-full h-full object-cover transition-transform duration-700">
            <span class="absolute top-5 right-5 bg-white/90 backdrop-blur px-4 py-1.5 rounded-xl text-xs font-black shadow-sm ${p.type === 'For Rent' ? 'text-blue-600' : 'text-emerald-600'}">${p.type === 'For Rent' ? 'للإيجار' : 'للبيع'}</span>
            <div class="absolute bottom-5 left-5 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                <span class="text-amber-400 text-sm">⭐</span> <span class="font-black text-xs text-slate-800">${p.rating}</span>
            </div>
        </div>
        <div class="p-8">
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-2xl font-black text-blue-700">${p.price}</h4>
                <div class="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">${p.match} AI Match</div>
            </div>
            <h3 class="font-black text-lg mb-3 text-slate-800">${p.title}</h3>
            <div class="flex items-center gap-4 text-slate-400 font-bold text-xs mb-6">
                <span>🛏️ ${p.beds} غرف</span>
                <span>🚿 ${p.baths} حمام</span>
                <span>📐 ${p.sqft} متر</span>
            </div>
            <div class="pt-6 border-t border-slate-50 flex items-center justify-between text-slate-400 text-xs font-bold">
                <span class="flex items-center gap-1">📍 ${p.loc}</span>
                <a href="details.html" class="text-blue-700 font-black hover:underline transition">التفاصيل ←</a>
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
