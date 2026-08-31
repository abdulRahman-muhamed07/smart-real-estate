// Seed script — populates MongoDB with realistic Egyptian real estate data.
// Run: node seed.js   (from smart-real-estate-backend/)

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Property = require('./models/Property');
const Booking = require('./models/Booking');
const Review = require('./models/Review');

const PLACEHOLDER_IMAGES = [
    { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', publicId: 'seed_villa_1' },
    { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', publicId: 'seed_villa_2' },
    { url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', publicId: 'seed_apt_1' },
    { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', publicId: 'seed_apt_2' },
    { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', publicId: 'seed_house_1' },
    { url: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800', publicId: 'seed_office_1' },
    { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', publicId: 'seed_modern_1' },
    { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', publicId: 'seed_luxury_1' },
    { url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800', publicId: 'seed_apt_3' },
    { url: 'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800', publicId: 'seed_villa_3' },
];

const LOCATIONS = [
    'القاهرة الجديدة', 'التجمع الخامس', 'مدينة الشروق', 'الإسكندرية',
    'مدينة نصر', 'المعادي', 'الشيخ زايد', '6 أكتوبر', 'العبور', 'الرحاب',
];

const NEARBY_OPTIONS = [
    ['مدرسة', 'مستشفى', 'مترو'],
    ['نادي', 'مول', 'حديقة'],
    ['جامعة', 'مطعم', 'سوبر ماركت'],
    ['مترو', 'مدرسة', 'صيدلية'],
    ['مول', 'نادي', 'مستشفى'],
    ['حديقة', 'مسجد', 'مدرسة'],
    ['شاطئ', 'مطعم', 'كافيه'],
];

const PROPERTY_TYPES = [
    { type: 'apartment', area: [80, 250], rooms: [2, 5], baths: [1, 3], priceSale: [300000, 2500000], priceRent: [5000, 25000] },
    { type: 'villa', area: [300, 800], rooms: [4, 8], baths: [3, 6], priceSale: [2000000, 15000000], priceRent: [15000, 80000] },
    { type: 'house', area: [200, 500], rooms: [3, 7], baths: [2, 5], priceSale: [800000, 5000000], priceRent: [8000, 35000] },
    { type: 'office', area: [50, 300], rooms: [1, 4], baths: [1, 2], priceSale: [200000, 2000000], priceRent: [3000, 20000] },
];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing seed data (keep existing admin/vendor users)
    await Property.deleteMany({ 'images.0.publicId': /^seed_/ });
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({ email: /@seed\.com$/ });
    console.log('Cleared old seed data');

    const seedPassword = 'password123'; // Model's pre-save hook will hash this

    // Create users
    const admin = await User.create({ name: 'مدير النظام', email: 'admin@seed.com', password: seedPassword, role: 'admin', phone: '+201000000001' });
    const vendor1 = await User.create({ name: 'أحمد للإستثمار العقاري', email: 'vendor1@seed.com', password: seedPassword, role: 'vendor', phone: '+201000000002' });
    const vendor2 = await User.create({ name: 'شركة النخبة العقارية', email: 'vendor2@seed.com', password: seedPassword, role: 'vendor', phone: '+201000000003' });
    const user1 = await User.create({ name: 'محمد علي', email: 'user1@seed.com', password: seedPassword, role: 'user', phone: '+201000000004' });
    const user2 = await User.create({ name: 'سارة حسن', email: 'user2@seed.com', password: seedPassword, role: 'user', phone: '+201000000005' });

    const vendors = [vendor1, vendor2];
    const users = [user1, user2];
    console.log(`Created ${5} users (1 admin, 2 vendors, 2 users)`);

    // Create 24 properties
    const properties = [];
    const arabicTitles = {
        apartment: ['شقة فاخرة', 'شقة سوبر لوكس', 'شقة عصرية', 'شقة واسعة', 'بنتهاوس راقي', 'استوديو حديث'],
        villa: ['فيلا مودرن', 'فيلا بإطلالة', 'قصر صغير', 'فيلا دوبلكس', 'فيلا مع حديقة', 'تاون هاوس فاخر'],
        house: ['منزل عائلي', 'بيت مستقل', 'منزل ريفي', 'مسكن هادئ'],
        office: ['مكتب إداري', 'مكتب تجاري', 'مقر شركة', 'مساحة عمل مشتركة'],
    };

    for (let i = 0; i < 24; i++) {
        const config = pick(PROPERTY_TYPES);
        const titlePrefix = pick(arabicTitles[config.type]);
        const location = pick(LOCATIONS);
        const listingType = i % 3 === 0 ? 'rent' : 'sale';
        const area = rand(...config.area);
        const rooms = rand(...config.rooms);
        const bathrooms = rand(...config.baths);
        const priceRange = listingType === 'rent' ? config.priceRent : config.priceSale;
        const price = rand(...priceRange);
        const images = [pick(PLACEHOLDER_IMAGES), pick(PLACEHOLDER_IMAGES), pick(PLACEHOLDER_IMAGES)].filter((_, idx) => idx < rand(1, 3));
        const nearbyServices = pick(NEARBY_OPTIONS);
        const statuses = ['available', 'available', 'available', 'available', 'booked', 'sold'];
        const status = pick(statuses);

        const property = await Property.create({
            title: `${titlePrefix} في ${location}`,
            description: `${titlePrefix} لل${listingType === 'rent' ? 'إيجار' : 'بيع'} في موقع متميز ${location}. مساحة ${area} متر مربع، ${rooms} غرف، ${bathrooms} حمام. تشطيب سوبر لوكس، مداخل خاصة، أمن وحراسة 24 ساعة. قريبة من ${(nearbyServices || []).join('، ')}.`,
            price,
            location,
            area,
            rooms,
            bathrooms,
            type: config.type,
            listingType,
            nearbyServices,
            images,
            status,
            vendor: pick(vendors)._id,
        });
        properties.push(property);
    }
    console.log(`Created ${properties.length} properties`);

    // Create bookings
    const availableProperties = properties.filter(p => p.status === 'available');
    const bookings = [];
    for (let i = 0; i < 8; i++) {
        const property = availableProperties[i % availableProperties.length];
        const booking = await Booking.create({
            user: pick(users)._id,
            property: property._id,
            status: pick(['pending', 'pending', 'confirmed', 'cancelled']),
        });
        bookings.push(booking);

        // Update property status
        if (booking.status === 'pending') {
            property.status = 'booked';
            await property.save();
        }
    }
    console.log(`Created ${bookings.length} bookings`);

    // Create reviews
    const reviews = [];
    const reviewComments = [
        'عقار رائع جداً، التشطيب ممتاز والموقع استراتيجي.',
        'تجربة ممتازة، أنصح بالتعامل مع المالك.',
        'جيد، لكن السعر مرتفع قليلاً مقارنة بالمساحة.',
        'موقع مميز جداً، قريب من جميع الخدمات.',
        'عقار يستحق الاستثمار، عائد إيجاري ممتاز.',
        'مساحات واسعة وإطلالة جميلة.',
        'تشطيب راقي وتصميم عصري.',
        'منطقة هادئة ومناسبة للعائلات.',
    ];

    for (const property of properties.slice(0, 12)) {
        const reviewer = pick(users);
        if (property.vendor.toString() === reviewer._id.toString()) continue;

        const review = await Review.create({
            user: reviewer._id,
            property: property._id,
            rating: rand(3, 5),
            comment: pick(reviewComments),
        });
        reviews.push(review);
    }
    console.log(`Created ${reviews.length} reviews`);

    // Create favorites
    for (const user of users) {
        const favs = properties.sort(() => Math.random() - 0.5).slice(0, rand(3, 6));
        user.favorites = favs.map(p => p._id);
        await user.save();
    }
    console.log('Added favorites to users');

    await mongoose.disconnect();
    console.log('\n✅ Seed complete!');
    console.log('   Admin login:  admin@seed.com / password123');
    console.log('   Vendor login: vendor1@seed.com / password123');
    console.log('   User login:   user1@seed.com / password123');
}

seed().catch(err => { console.error(err); process.exit(1); });
