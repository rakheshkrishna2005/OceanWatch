import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "ocean_hazard_platform"

const mockHazards = [
  {
    title: "Oil Spill Near Mumbai Harbor",
    description:
      "Large oil spill observed approximately 3 nautical miles offshore from Mumbai Harbor. Dark patches visible on water surface with strong petroleum odor.",
    location: "Mumbai, Maharashtra",
    hazardType: "Oil Spill",
    severity: "Critical",
    status: "Verified",
    dateReported: new Date("2024-01-15"),
    reportedBy: "Indian Coast Guard",
    coordinates: { lat: 18.922, lng: 72.8347 },
    mediaFiles: [],
    contactInfo: {
      name: "Captain Rajesh Kumar",
      email: "rajesh.kumar@coastguard.gov.in",
      phone: "+91-9876543210",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Harmful Algal Bloom in Chilika Lake",
    description:
      "Red tide algal bloom detected in the northern section of Chilika Lake. Fish mortality reported by local fishermen.",
    location: "Chilika Lake, Odisha",
    hazardType: "Harmful Algal Bloom",
    severity: "High",
    status: "Verified",
    dateReported: new Date("2024-01-14"),
    reportedBy: "Marine Biologist",
    coordinates: { lat: 19.7179, lng: 85.3206 },
    mediaFiles: [],
    contactInfo: {
      name: "Dr. Priya Sharma",
      email: "priya.sharma@nio.org",
      phone: "+91-9123456789",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Plastic Debris Accumulation",
    description:
      "Large accumulation of plastic bottles, bags, and fishing nets observed floating near Kochi backwaters. Affecting local marine life.",
    location: "Kochi, Kerala",
    hazardType: "Marine Debris",
    severity: "Medium",
    status: "Unverified",
    dateReported: new Date("2024-01-13"),
    reportedBy: "Local Fisherman",
    coordinates: { lat: 9.9312, lng: 76.2673 },
    mediaFiles: [],
    contactInfo: {
      name: "Ravi Menon",
      email: "ravi.menon@gmail.com",
      phone: "+91-9876543211",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Chemical Discharge from Industrial Plant",
    description:
      "Suspicious chemical discharge observed from coastal pharmaceutical facility in Visakhapatnam. Water discoloration and dead fish reported.",
    location: "Visakhapatnam, Andhra Pradesh",
    hazardType: "Chemical Contamination",
    severity: "High",
    status: "Verified",
    dateReported: new Date("2024-01-12"),
    reportedBy: "Environmental Inspector",
    coordinates: { lat: 17.6868, lng: 83.2185 },
    mediaFiles: [],
    contactInfo: {
      name: "Suresh Reddy",
      email: "suresh.reddy@appcb.gov.in",
      phone: "+91-9234567890",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Abandoned Fishing Vessel Leaking Fuel",
    description:
      "Abandoned fishing trawler taking on water and leaking diesel fuel in shallow waters near Goa coastline. Immediate cleanup required.",
    location: "Panaji, Goa",
    hazardType: "Abandoned Vessel",
    severity: "Critical",
    status: "Verified",
    dateReported: new Date("2024-01-10"),
    reportedBy: "Harbor Master",
    coordinates: { lat: 15.4909, lng: 73.8278 },
    mediaFiles: [],
    contactInfo: {
      name: "Antonio D'Souza",
      email: "antonio.dsouza@goaports.gov.in",
      phone: "+91-9345678901",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Coral Bleaching Event",
    description:
      "Extensive coral bleaching observed in Lakshadweep coral reefs. Temperature stress and pollution suspected causes.",
    location: "Lakshadweep Islands",
    hazardType: "Coral Bleaching",
    severity: "High",
    status: "Verified",
    dateReported: new Date("2024-01-09"),
    reportedBy: "Marine Research Institute",
    coordinates: { lat: 10.5667, lng: 72.6417 },
    mediaFiles: [],
    contactInfo: {
      name: "Dr. Kavitha Nair",
      email: "kavitha.nair@cmfri.org.in",
      phone: "+91-9456789012",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Sewage Discharge into Ganges Delta",
    description:
      "Untreated sewage discharge from urban areas flowing into Ganges delta affecting marine ecosystem in Sundarbans.",
    location: "Sundarbans, West Bengal",
    hazardType: "Sewage Discharge",
    severity: "Medium",
    status: "Unverified",
    dateReported: new Date("2024-01-08"),
    reportedBy: "Environmental Activist",
    coordinates: { lat: 21.9497, lng: 88.2636 },
    mediaFiles: [],
    contactInfo: {
      name: "Amit Ghosh",
      email: "amit.ghosh@greenpeace.org",
      phone: "+91-9567890123",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Dead Whale Washed Ashore",
    description:
      "Large sperm whale carcass washed ashore on Chennai beach. Preliminary examination suggests plastic ingestion as possible cause.",
    location: "Chennai, Tamil Nadu",
    hazardType: "Dead Marine Life",
    severity: "Medium",
    status: "Closed",
    dateReported: new Date("2024-01-07"),
    reportedBy: "Beach Patrol",
    coordinates: { lat: 13.0827, lng: 80.2707 },
    mediaFiles: [],
    contactInfo: {
      name: "Murugan Selvam",
      email: "murugan.selvam@tnforest.gov.in",
      phone: "+91-9678901234",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Fishing Net Entanglement of Sea Turtles",
    description:
      "Multiple Olive Ridley sea turtles found entangled in abandoned fishing nets near Rushikulya rookery. Rescue operation initiated.",
    location: "Rushikulya, Odisha",
    hazardType: "Fishing Net Entanglement",
    severity: "High",
    status: "Verified",
    dateReported: new Date("2024-01-06"),
    reportedBy: "Wildlife Conservationist",
    coordinates: { lat: 19.3197, lng: 84.8731 },
    mediaFiles: [],
    contactInfo: {
      name: "Bijay Mohanty",
      email: "bijay.mohanty@wwfindia.net",
      phone: "+91-9789012345",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Coastal Erosion Threatening Village",
    description:
      "Severe coastal erosion threatening fishing village in Puducherry. Sea level rise and storm surge damage to coastal infrastructure.",
    location: "Puducherry",
    hazardType: "Coastal Erosion",
    severity: "Medium",
    status: "Verified",
    dateReported: new Date("2024-01-05"),
    reportedBy: "District Collector",
    coordinates: { lat: 11.9416, lng: 79.8083 },
    mediaFiles: [],
    contactInfo: {
      name: "Lakshmi Priya",
      email: "lakshmi.priya@nic.in",
      phone: "+91-9890123456",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Microplastic Contamination Study",
    description:
      "High levels of microplastics detected in water samples from Mandovi River estuary. Impact on local fish population being studied.",
    location: "Mandovi River, Goa",
    hazardType: "Microplastic Contamination",
    severity: "Low",
    status: "Unverified",
    dateReported: new Date("2024-01-04"),
    reportedBy: "Research Student",
    coordinates: { lat: 15.5057, lng: 73.9964 },
    mediaFiles: [],
    contactInfo: {
      name: "Neha Patel",
      email: "neha.patel@student.goa.ac.in",
      phone: "+91-9901234567",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Industrial Effluent Discharge",
    description:
      "Textile industry effluent discharge turning Noyyal River water dark blue near Tirupur. Affecting downstream marine areas.",
    location: "Tirupur, Tamil Nadu",
    hazardType: "Industrial Effluent",
    severity: "High",
    status: "Closed",
    dateReported: new Date("2024-01-03"),
    reportedBy: "Pollution Control Board",
    coordinates: { lat: 11.1085, lng: 77.3411 },
    mediaFiles: [],
    contactInfo: {
      name: "Venkatesh Kumar",
      email: "venkatesh.kumar@tnpcb.gov.in",
      phone: "+91-9012345678",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db(DB_NAME)
    const collection = db.collection("hazard_reports")

    // Clear existing data
    await collection.deleteMany({})
    console.log("Cleared existing hazard reports")

    // Insert mock data
    const result = await collection.insertMany(mockHazards)
    console.log(`Inserted ${result.insertedCount} hazard reports`)

    // Create indexes for better performance
    await collection.createIndex({ location: 1 })
    await collection.createIndex({ hazardType: 1 })
    await collection.createIndex({ status: 1 })
    await collection.createIndex({ severity: 1 })
    await collection.createIndex({ dateReported: -1 })
    await collection.createIndex({ "coordinates.lat": 1, "coordinates.lng": 1 })

    console.log("Created database indexes")
    console.log("Database seeding completed successfully!")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await client.close()
  }
}

seedDatabase()
