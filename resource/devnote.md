Developer Notes: Salex V1 Architecture & Implementation
To: Lead Developer

From: Principal Architect

Date: July 27, 2025

Subject: Technical Implementation Guide for Salex V1

Bhai, humare paas Salex ka PRD final ho chuka hai. Ab hum is vision ko code mein badlenge. Yeh notes aapko system ke do sabse critical parts ko design karne mein guide karenge. Humara goal hai ek robust, scalable, aur maintainable system banana.

Note 1: WhatsApp Conversation Management (The "One Number to Rule Them All" Logic)
Humara sabse bada strategic decision hai ek single official WhatsApp number ka istemaal karna. Isse humare salon partners ke liye verification aur billing ki saari problems khatam ho jaati hain. Lekin iska matlab hai ki hamare backend ko smart hona padega taaki woh hazaaron conversations ko correctly handle kar sake.

The Flow (Message ka Safar):

Yahan ek-ek step bataya gaya hai ki customer ke "Hi" se lekar booking tak ka message flow kaise manage hoga:

The Entry Point (QR Code):

Har salon ko ek unique Dynamic QR Code milega. Yeh QR code is link par point karega: wa.me/91OUR_NUMBER?text=BOOK_AT_S123 (jahan S123 us salon ka unique ID hai).

Jab customer scan karega, toh uske WhatsApp mein BOOK_AT_S123 pehle se likha hua aayega. Usko sirf send button dabana hai.

Webhook Receives the Message:

Hamare backend par jo webhook (/whatsapp/webhook) hai, use Meta se ek JSON payload milega.

Is payload mein message.text ("BOOK_AT_S123") aur message.from (customer ka number) hoga.

Session Creation & Context Setting (The Magic):

Hamara WhatsApp Adapter is message ko parse karega.

Woh BOOK_AT_S123 se salon ka ID (S123) nikalega.

Ab woh Redis mein ek naya session create karega. Key customer ka phone number hoga.

// Redis Command (Example)
SET user:91xxxxxxxxxx '{"current_salon_id": "S123", "state": "AWAITING_SERVICE_SELECTION"}' EX 600

Isse humein agle 10 minute tak pata rahega ki yeh customer S123 salon se baat kar raha hai.

Dynamic Bot Response:

Ab jab backend ko pata hai ki yeh S123 salon ke liye hai, woh database se us salon ka config.json (services, pricing) load karega.

Bot customer ko us salon ki services (jo config se aayi hain) buttons ke roop mein dikhayega.

Managing the Conversation:

Jab tak customer ka session Redis mein active hai, uske saare button clicks ya messages usi salon ke context mein process honge.

Jaise hi booking Confirmed ya Cancelled hoti hai, ya session timeout hota hai, hum Redis se uski entry delete kar denge.

Important for Developer: Salon owner ko is chat ka koi access nahi hai. Agar customer koi aisa sawaal poochta hai jiska jawab bot nahi de sakta, toh hum us message ko Merchant App mein ek "Support Chat" section mein route karenge. Salon owner wahin se reply karega, aur hamara backend us reply ko hamare official number se customer ko bhejega.

Note 2: Modular Implementation (The "Build Once, Scale Everywhere" Engine)
Hum sirf ek salon app nahi bana rahe, hum ek Business Engine bana rahe hain. Iska matlab hai ki code ko shuruaat se hi modular aur business-agnostic likhna hai.

The First Screen Logic:

Aapne bilkul sahi socha hai. Merchant App ki pehli screen poochegi: "Aapka Business Kis Type ka hai?"

[ Button: 💇 Salon ]

[ Button: 🏪 General Store ] (Future)

[ Button: 🍔 Food Vendor ] (Future)

The Configuration-Driven Architecture:

Jab user "Salon" par click karega, toh backend mein yeh hoga:

Load the Right Config: Hamara Business Engine salon_config.json file ko load karega. Yeh file define karegi ki ek "salon" kya hota hai.

// salon_config.json
{
  "business_type": "salon",
  "booking_noun_singular": "Appointment",
  "booking_noun_plural": "Appointments",
  "resource_noun": "Stylist",
  "features_enabled": ["slot_booking", "service_catalogue"],
  "onboarding_steps": ["add_services", "add_staff", "set_timings"]
}

Dynamic UI Generation: Merchant App is config ko receive karega aur uske hisaab se UI banayega.

Onboarding flow mein woh add_services, add_staff, set_timings waali screens dikhayega.

Dashboard par "Appointments" likha aayega, naaki "Orders".

Object-Oriented Code Structure (High-Level Example):

Is logic ko implement karne ke liye, hum ek base class aur uske extensions banayenge.

// /core/business-engine.js

// Yeh hamara universal engine hai. Yeh kuch nahi jaanta ki salon kya hota hai.
class BusinessEngine {
    constructor(config) {
        this.config = config; // The magic config file
    }

    // Universal methods
    createBooking(data) {
        console.log(`Creating a new ${this.config.booking_noun_singular}...`);
        // Universal booking logic here...
    }

    getDashboardData() {
        console.log(`Fetching data for ${this.config.business_type}...`);
        // Universal data fetching logic...
    }
}

// /modules/salon/salon-engine.js

// Yeh Salon ka specialist hai.
class SalonEngine extends BusinessEngine {
    constructor(config) {
        super(config); // Parent ko config pass karna
    }

    // Salon-specific methods
    getStylistSchedule(stylistId) {
        console.log(`Fetching schedule for stylist: ${stylistId}`);
        // Logic to get a specific stylist's schedule...
    }
}

// Factory to create the right engine
// /core/engine-factory.js
function createEngineForBusiness(business) {
    const config = business.config; // Load config from DB
    switch (config.business_type) {
        case 'salon':
            return new SalonEngine(config);
        case 'store':
            // return new StoreEngine(config); // For the future
        default:
            throw new Error('Unknown business type');
    }
}

Developer ke liye Final Salah: Har function likhte waqt, khud se yeh sawaal poochho: "Kya yeh function sirf salon ke liye hai, ya yeh kisi bhi business ke liye kaam kar sakta hai?" Agar jawab "kisi bhi business" hai, toh woh code /core folder mein jaayega. Agar jawab "sirf salon" hai, toh woh /modules/salon folder mein jaayega.

Is approach se, kal jab humein "General Store" add karna hoga, toh humein sirf ek store_config.json aur ek StoreEngine.js file banani padegi. Hamara 80% core system pehle se taiyaar hoga.