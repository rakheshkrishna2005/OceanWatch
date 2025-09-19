export interface HazardReport {
  id: number
  title: string
  description: string
  location: string
  hazardType: string
  severity: "Low" | "Medium" | "High" | "Critical"
  status: "Unverified" | "Verified" | "Closed"
  dateReported: string
  reportedBy: string
  coordinates: { lat: number; lng: number }
  mediaCount: number
  contactInfo?: {
    name: string
    email: string
    phone: string
  }
}

export const mockHazards: HazardReport[] = [
  {
    id: 1,
    title: "Oil Spill Near Mumbai Harbor",
    description:
      "Large oil spill observed approximately 3 nautical miles offshore from Mumbai Harbor. Dark patches visible on water surface with strong petroleum odor.",
    location: "Mumbai, Maharashtra",
    hazardType: "Oil Spill",
    severity: "Critical",
    status: "Verified",
    dateReported: "2024-01-15",
    reportedBy: "Indian Coast Guard",
    coordinates: { lat: 18.922, lng: 72.8347 },
    mediaCount: 5,
    contactInfo: {
      name: "Captain Rajesh Kumar",
      email: "rajesh.kumar@coastguard.gov.in",
      phone: "+91-9876543210",
    },
  },
  {
    id: 2,
    title: "Harmful Algal Bloom in Chilika Lake",
    description:
      "Red tide algal bloom detected in the northern section of Chilika Lake. Fish mortality reported by local fishermen.",
    location: "Chilika Lake, Odisha",
    hazardType: "Harmful Algal Bloom",
    severity: "High",
    status: "Verified",
    dateReported: "2024-01-14",
    reportedBy: "Marine Biologist",
    coordinates: { lat: 19.7179, lng: 85.3206 },
    mediaCount: 8,
    contactInfo: {
      name: "Dr. Priya Sharma",
      email: "priya.sharma@nio.org",
      phone: "+91-9123456789",
    },
  },
  {
    id: 3,
    title: "Plastic Debris Accumulation",
    description:
      "Large accumulation of plastic bottles, bags, and fishing nets observed floating near Kochi backwaters. Affecting local marine life.",
    location: "Kochi, Kerala",
    hazardType: "Marine Debris",
    severity: "Medium",
    status: "Unverified",
    dateReported: "2024-01-13",
    reportedBy: "Local Fisherman",
    coordinates: { lat: 9.9312, lng: 76.2673 },
    mediaCount: 3,
    contactInfo: {
      name: "Ravi Menon",
      email: "ravi.menon@gmail.com",
      phone: "+91-9876543211",
    },
  },
  {
    id: 4,
    title: "Chemical Discharge from Industrial Plant",
    description:
      "Suspicious chemical discharge observed from coastal pharmaceutical facility in Visakhapatnam. Water discoloration and dead fish reported.",
    location: "Visakhapatnam, Andhra Pradesh",
    hazardType: "Chemical Contamination",
    severity: "High",
    status: "Verified",
    dateReported: "2024-01-12",
    reportedBy: "Environmental Inspector",
    coordinates: { lat: 17.6868, lng: 83.2185 },
    mediaCount: 6,
    contactInfo: {
      name: "Suresh Reddy",
      email: "suresh.reddy@appcb.gov.in",
      phone: "+91-9234567890",
    },
  },
  {
    id: 5,
    title: "Abandoned Fishing Vessel Leaking Fuel",
    description:
      "Abandoned fishing trawler taking on water and leaking diesel fuel in shallow waters near Goa coastline. Immediate cleanup required.",
    location: "Panaji, Goa",
    hazardType: "Abandoned Vessel",
    severity: "Critical",
    status: "Verified",
    dateReported: "2024-01-10",
    reportedBy: "Harbor Master",
    coordinates: { lat: 15.4909, lng: 73.8278 },
    mediaCount: 4,
    contactInfo: {
      name: "Antonio D'Souza",
      email: "antonio.dsouza@goaports.gov.in",
      phone: "+91-9345678901",
    },
  },
  {
    id: 6,
    title: "Coral Bleaching Event",
    description:
      "Extensive coral bleaching observed in Lakshadweep coral reefs. Temperature stress and pollution suspected causes.",
    location: "Lakshadweep Islands",
    hazardType: "Coral Bleaching",
    severity: "High",
    status: "Verified",
    dateReported: "2024-01-09",
    reportedBy: "Marine Research Institute",
    coordinates: { lat: 10.5667, lng: 72.6417 },
    mediaCount: 12,
    contactInfo: {
      name: "Dr. Kavitha Nair",
      email: "kavitha.nair@cmfri.org.in",
      phone: "+91-9456789012",
    },
  },
  {
    id: 7,
    title: "Sewage Discharge into Ganges Delta",
    description:
      "Untreated sewage discharge from urban areas flowing into Ganges delta affecting marine ecosystem in Sundarbans.",
    location: "Sundarbans, West Bengal",
    hazardType: "Sewage Discharge",
    severity: "Medium",
    status: "Unverified",
    dateReported: "2024-01-08",
    reportedBy: "Environmental Activist",
    coordinates: { lat: 21.9497, lng: 88.2636 },
    mediaCount: 2,
    contactInfo: {
      name: "Amit Ghosh",
      email: "amit.ghosh@greenpeace.org",
      phone: "+91-9567890123",
    },
  },
  {
    id: 8,
    title: "Dead Whale Washed Ashore",
    description:
      "Large sperm whale carcass washed ashore on Chennai beach. Preliminary examination suggests plastic ingestion as possible cause.",
    location: "Chennai, Tamil Nadu",
    hazardType: "Dead Marine Life",
    severity: "Medium",
    status: "Closed",
    dateReported: "2024-01-07",
    reportedBy: "Beach Patrol",
    coordinates: { lat: 13.0827, lng: 80.2707 },
    mediaCount: 7,
    contactInfo: {
      name: "Murugan Selvam",
      email: "murugan.selvam@tnforest.gov.in",
      phone: "+91-9678901234",
    },
  },
  {
    id: 9,
    title: "Fishing Net Entanglement of Sea Turtles",
    description:
      "Multiple Olive Ridley sea turtles found entangled in abandoned fishing nets near Rushikulya rookery. Rescue operation initiated.",
    location: "Rushikulya, Odisha",
    hazardType: "Fishing Net Entanglement",
    severity: "High",
    status: "Verified",
    dateReported: "2024-01-06",
    reportedBy: "Wildlife Conservationist",
    coordinates: { lat: 19.3197, lng: 84.8731 },
    mediaCount: 9,
    contactInfo: {
      name: "Bijay Mohanty",
      email: "bijay.mohanty@wwfindia.net",
      phone: "+91-9789012345",
    },
  },
  {
    id: 10,
    title: "Coastal Erosion Threatening Village",
    description:
      "Severe coastal erosion threatening fishing village in Puducherry. Sea level rise and storm surge damage to coastal infrastructure.",
    location: "Puducherry",
    hazardType: "Coastal Erosion",
    severity: "Medium",
    status: "Verified",
    dateReported: "2024-01-05",
    reportedBy: "District Collector",
    coordinates: { lat: 11.9416, lng: 79.8083 },
    mediaCount: 5,
    contactInfo: {
      name: "Lakshmi Priya",
      email: "lakshmi.priya@nic.in",
      phone: "+91-9890123456",
    },
  },
  {
    id: 11,
    title: "Microplastic Contamination Study",
    description:
      "High levels of microplastics detected in water samples from Mandovi River estuary. Impact on local fish population being studied.",
    location: "Mandovi River, Goa",
    hazardType: "Microplastic Contamination",
    severity: "Low",
    status: "Unverified",
    dateReported: "2024-01-04",
    reportedBy: "Research Student",
    coordinates: { lat: 15.5057, lng: 73.9964 },
    mediaCount: 1,
    contactInfo: {
      name: "Neha Patel",
      email: "neha.patel@student.goa.ac.in",
      phone: "+91-9901234567",
    },
  },
  {
    id: 12,
    title: "Industrial Effluent Discharge",
    description:
      "Textile industry effluent discharge turning Noyyal River water dark blue near Tirupur. Affecting downstream marine areas.",
    location: "Tirupur, Tamil Nadu",
    hazardType: "Industrial Effluent",
    severity: "High",
    status: "Closed",
    dateReported: "2024-01-03",
    reportedBy: "Pollution Control Board",
    coordinates: { lat: 11.1085, lng: 77.3411 },
    mediaCount: 8,
    contactInfo: {
      name: "Venkatesh Kumar",
      email: "venkatesh.kumar@tnpcb.gov.in",
      phone: "+91-9012345678",
    },
  },
]

export const hazardTypes = [
  "Oil Spill",
  "Chemical Contamination",
  "Marine Debris",
  "Harmful Algal Bloom",
  "Dead Marine Life",
  "Coastal Erosion",
  "Sewage Discharge",
  "Abandoned Vessel",
  "Fishing Net Entanglement",
  "Coral Bleaching",
  "Microplastic Contamination",
  "Industrial Effluent",
]

export const locations = [
  "Mumbai, Maharashtra",
  "Chennai, Tamil Nadu",
  "Kochi, Kerala",
  "Visakhapatnam, Andhra Pradesh",
  "Panaji, Goa",
  "Kolkata, West Bengal",
  "Bhubaneswar, Odisha",
  "Mangalore, Karnataka",
  "Puducherry",
  "Port Blair, Andaman & Nicobar",
  "Lakshadweep Islands",
  "Daman, Daman & Diu",
]

// Mock KPI data
export const mockKPIs = {
  totalReports: mockHazards.length,
  verifiedReports: mockHazards.filter((h) => h.status === "Verified").length,
  pendingVerification: mockHazards.filter((h) => h.status === "Unverified").length,
  closedReports: mockHazards.filter((h) => h.status === "Closed").length,
  activeLocations: [...new Set(mockHazards.filter((h) => h.status !== "Closed").map((h) => h.location))].length,
  criticalHazards: mockHazards.filter((h) => h.severity === "Critical" && h.status !== "Closed").length,
}

// Mock chart data
export const mockChartData = {
  hazardsByType: hazardTypes.map((type) => ({
    name: type,
    value: mockHazards.filter((h) => h.hazardType === type).length,
    fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
  })),
  hazardsByStatus: [
    { name: "Verified", value: mockKPIs.verifiedReports, fill: "hsl(142, 76%, 36%)" },
    { name: "Unverified", value: mockKPIs.pendingVerification, fill: "hsl(48, 96%, 53%)" },
    { name: "Closed", value: mockKPIs.closedReports, fill: "hsl(215, 20%, 65%)" },
  ],
  hazardsBySeverity: [
    { name: "Critical", value: mockHazards.filter((h) => h.severity === "Critical").length, fill: "hsl(0, 84%, 60%)" },
    { name: "High", value: mockHazards.filter((h) => h.severity === "High").length, fill: "hsl(25, 95%, 53%)" },
    { name: "Medium", value: mockHazards.filter((h) => h.severity === "Medium").length, fill: "hsl(48, 96%, 53%)" },
    { name: "Low", value: mockHazards.filter((h) => h.severity === "Low").length, fill: "hsl(142, 76%, 36%)" },
  ],
}
