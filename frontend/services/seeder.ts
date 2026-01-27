import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Offer, AccommodationOffer, TourOffer, LocationData } from "../types/offer";
import { Review } from "../types/review";

// --- MOCK DATA ---

const MOCK_IMAGES = {
    // Hotels & Apartments
    hotel_paris: "https://images.unsplash.com/photo-1549144511-300ad1223fb7?q=80&w=1000&auto=format&fit=crop", // Paris Hotel
    hotel_room: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1000&auto=format&fit=crop", // Modern Hotel Room
    apartment_ny: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000&auto=format&fit=crop", // NY Apartment
    resort_bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1000&auto=format&fit=crop", // Bali Resort

    // Tours
    safari: "https://images.unsplash.com/photo-1547471080-7541fbb55b6d?q=80&w=1000&auto=format&fit=crop", // Elephant Safari
    scuba: "https://images.unsplash.com/photo-1544551763-46a8723ba3f9?q=80&w=1000&auto=format&fit=crop", // Underwater
    hiking: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1000&auto=format&fit=crop", // Hiking
    city_tour: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000&auto=format&fit=crop", // Paris Street
};

const MOCK_LOCATIONS: Record<string, LocationData> = {
    paris: {
        address: "Champ de Mars, 5 Avenue Anatole France",
        city: "Paris",
        country: "France",
        latitude: 48.8584,
        longitude: 2.2945,
        geohash: "u09j" // simplified
    },
    bali: {
        address: "Ubud, Gianyar",
        city: "Bali",
        country: "Indonesia",
        latitude: -8.5069,
        longitude: 115.2625,
        geohash: "qw7r"
    },
    ny: {
        address: "Central Park West",
        city: "New York",
        country: "USA",
        latitude: 40.785091,
        longitude: -73.968285,
        geohash: "dr5r"
    },
    cairo: {
        address: "Giza Plateau",
        city: "Cairo",
        country: "Egypt",
        latitude: 29.9792,
        longitude: 31.1342,
        geohash: "stq5"
    }
};

const MOCK_REVIEWS_CONTENT = [
    "Absolutely amazing experience! Highly recommended.",
    "The view was breathtaking, but the service could be better.",
    "Worth every penny. I will definitely come back.",
    "A hidden gem! So glad we found this place.",
    "Decent, but a bit overpriced for what you get."
];

export const SeederService = {
    seedDatabase: async () => {
        const currentUser = auth().currentUser;
        if (!currentUser) throw new Error("Must be logged in to seed");

        console.log("Starting DB Seeder...");
        const batch = firestore().batch();

        // 1. Create Offers
        const offers: Offer[] = [

            // --- ACCOMMODATION: Bali Resort ---
            {
                id: firestore().collection('offers').doc().id,
                type: 'ACCOMMODATION',
                providerId: currentUser.uid,
                title: "Luxury Jungle Resort Ubud",
                description: "Escape to the heart of Bali's jungle. Infinity pools, organic food, and tranquility.",
                price: 150,
                currency: "USD",
                images: [MOCK_IMAGES.resort_bali, MOCK_IMAGES.hotel_room],
                location: MOCK_LOCATIONS.bali,
                verificationStatus: 'VERIFIED',
                isActive: true,
                rating: 4.8,
                reviewsCount: 12,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                details: {
                    propertyType: 'HOTEL',
                    checkInTime: '14:00',
                    checkOutTime: '11:00',
                    generalAmenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
                    units: [
                        {
                            id: 'u1',
                            name: 'Jungle Suite',
                            unitDescription: 'Suite with private balcony',
                            type: 'ROOM',
                            pricePerNight: 150,
                            capacity: { adults: 2, children: 1 },
                            bedConfig: '1 King Bed',
                            amenities: ['AC', 'Minibar'],
                            images: [MOCK_IMAGES.hotel_room],
                            quantity: 5
                        }
                    ]
                }
            } as AccommodationOffer,

            // --- TOUR: Safari ---
            {
                id: firestore().collection('offers').doc().id,
                type: 'TOURS',
                providerId: currentUser.uid,
                title: "African Savanna Safari",
                description: "Witness the big five in their natural habitat. Includes guide and 4x4 vehicle.",
                price: 300,
                currency: "USD",
                images: [MOCK_IMAGES.safari],
                location: { ...MOCK_LOCATIONS.cairo, city: "Nairobi", country: "Kenya" }, // Overriding location for variety
                verificationStatus: 'VERIFIED',
                isActive: true,
                rating: 5.0,
                reviewsCount: 24,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                details: {
                    duration: 8,
                    maxParticipants: 6,
                    startDates: ['2026-05-01', '2026-05-02'],
                    languages: ['English', 'Swahili'],
                    difficulty: 'EASY',
                    whatsIncluded: ['Lunch', 'Transport', 'Tickest'],
                    highlights: ['Lions', 'Elephants', 'Sunset'],
                    transportation: 'Land Cruiser 4x4'
                }
            } as TourOffer,

            // --- ACCOMMODATION: NY Apartment ---
            {
                id: firestore().collection('offers').doc().id,
                type: 'ACCOMMODATION',
                providerId: currentUser.uid,
                title: "Modern Loft in Manhattan",
                description: "Centrally located loft with skyline views. Walking distance to Central Park.",
                price: 250,
                currency: "USD",
                images: [MOCK_IMAGES.apartment_ny],
                location: MOCK_LOCATIONS.ny,
                verificationStatus: 'VERIFIED',
                isActive: true,
                rating: 4.5,
                reviewsCount: 8,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                details: {
                    propertyType: 'APARTMENT',
                    checkInTime: '15:00',
                    checkOutTime: '11:00',
                    generalAmenities: ['WiFi', 'Kitchen', 'Gym'],
                    units: [
                        {
                            id: 'u1',
                            name: 'Entire Loft',
                            unitDescription: 'Open plan living',
                            type: 'ENTIRE_APARTMENT',
                            pricePerNight: 250,
                            capacity: { adults: 4, children: 0 },
                            bedConfig: '2 Queen Beds',
                            amenities: ['TV', 'Washer'],
                            images: [MOCK_IMAGES.apartment_ny],
                            quantity: 1
                        }
                    ]
                }
            } as AccommodationOffer,

            // --- TOUR: Paris City Walk ---
            {
                id: firestore().collection('offers').doc().id,
                type: 'TOURS',
                providerId: currentUser.uid,
                title: "Romantic Paris Evening Walk",
                description: "Explore the city of lights with a local expert. Includes wine tasting.",
                price: 50,
                currency: "EUR",
                images: [MOCK_IMAGES.city_tour, MOCK_IMAGES.hotel_paris],
                location: MOCK_LOCATIONS.paris,
                verificationStatus: 'VERIFIED',
                isActive: true,
                rating: 4.9,
                reviewsCount: 15,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                details: {
                    duration: 3,
                    maxParticipants: 12,
                    startDates: ['Every Evening'],
                    languages: ['English', 'French', 'Spanish'],
                    difficulty: 'EASY',
                    whatsIncluded: ['Wine', 'Guide'],
                    highlights: ['Eiffel Tower', 'Louvre', 'Seine'],
                }
            } as TourOffer,
        ];

        // Add offers to batch
        offers.forEach(offer => {
            const offerRef = firestore().collection('offers').doc(offer.id);
            batch.set(offerRef, offer);

            // 2. Add Mock Reviews for each offer
            const numReviews = Math.floor(Math.random() * 5) + 2; // 2-6 reviews
            for (let i = 0; i < numReviews; i++) {
                const reviewId = firestore().collection('reviews').doc().id;
                const review: Review = {
                    id: reviewId,
                    offerId: offer.id,
                    userId: 'mock_user_' + i, // Fake user ID
                    userName: ['Alice', 'Bob', 'Charlie', 'Diana', 'Erik'][i % 5],
                    rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
                    content: MOCK_REVIEWS_CONTENT[i % MOCK_REVIEWS_CONTENT.length],
                    createdAt: Date.now() - (Math.random() * 1000000000)
                };
                const reviewRef = firestore().collection('reviews').doc(reviewId);
                batch.set(reviewRef, review);
            }
        });

        await batch.commit();
        console.log(`Seeded ${offers.length} offers and reviews.`);
        return offers.length;
    }
};
