// Mock venues used until the backend is live. Coordinates are around Seattle.
// Each venue carries a `features` array shaped for calculateAccessibilityScore.

export const MOCK_VENUES = [
  {
    id: "venue-1",
    name: "Seattle Central Library",
    address: "1000 4th Ave",
    city: "Seattle",
    state: "WA",
    zipCode: "98104",
    latitude: 47.6067,
    longitude: -122.3325,
    venueType: "library",
    totalReviews: 12,
    totalPhotos: 8,
    features: [
      { type: "entrance_detected", mlDetected: true, confidence: 0.94, verifiedCount: 5 },
      { type: "restroom_available", mlDetected: true, confidence: 0.88, verifiedCount: 4 },
      { type: "parking_area", mlDetected: true, confidence: 0.8, verifiedCount: 2 },
      { type: "seating_available", mlDetected: true, confidence: 0.9, verifiedCount: 3 },
    ],
  },
  {
    id: "venue-2",
    name: "Pike Place Market",
    address: "85 Pike St",
    city: "Seattle",
    state: "WA",
    zipCode: "98101",
    latitude: 47.6097,
    longitude: -122.3417,
    venueType: "market",
    totalReviews: 34,
    totalPhotos: 21,
    features: [
      { type: "entrance_detected", mlDetected: true, confidence: 0.7, verifiedCount: 6 },
      { type: "stairs_present", mlDetected: true, confidence: 0.95, verifiedCount: 8 },
      { type: "restroom_available", mlDetected: true, confidence: 0.6, verifiedCount: 2 },
    ],
  },
  {
    id: "venue-3",
    name: "Museum of Pop Culture",
    address: "325 5th Ave N",
    city: "Seattle",
    state: "WA",
    zipCode: "98109",
    latitude: 47.6215,
    longitude: -122.3481,
    venueType: "museum",
    totalReviews: 19,
    totalPhotos: 15,
    features: [
      { type: "entrance_detected", mlDetected: true, confidence: 0.96, verifiedCount: 7 },
      { type: "restroom_available", mlDetected: true, confidence: 0.92, verifiedCount: 5 },
      { type: "parking_area", mlDetected: true, confidence: 0.85, verifiedCount: 4 },
      { type: "indoor_seating", mlDetected: true, confidence: 0.88, verifiedCount: 3 },
    ],
  },
  {
    id: "venue-4",
    name: "Green Lake Park Cafe",
    address: "7351 East Green Lake Dr N",
    city: "Seattle",
    state: "WA",
    zipCode: "98115",
    latitude: 47.6797,
    longitude: -122.3283,
    venueType: "cafe",
    totalReviews: 6,
    totalPhotos: 4,
    features: [
      { type: "entrance_detected", mlDetected: false, confidence: null, verifiedCount: 2 },
      { type: "seating_available", mlDetected: true, confidence: 0.82, verifiedCount: 1 },
      { type: "stairs_present", mlDetected: true, confidence: 0.75, verifiedCount: 1 },
    ],
  },
];

export const MOCK_REVIEWS = {
  "venue-1": [
    {
      id: "review-1",
      userName: "David M.",
      rating: 5,
      comment:
        "Main entrance has a 36-inch automatic door and smooth concrete ramp. Restrooms on level 3 have grab bars on both sides.",
      visitDate: "2026-05-12",
      helpfulCount: 8,
    },
    {
      id: "review-2",
      userName: "Sarah C.",
      rating: 4,
      comment:
        "Plenty of turning space for a power chair. Accessible parking fills up fast on weekends.",
      visitDate: "2026-04-28",
      helpfulCount: 3,
    },
  ],
  "venue-2": [
    {
      id: "review-3",
      userName: "David M.",
      rating: 2,
      comment:
        "Lots of stairs and cobblestone. The main level is reachable but many stalls are not. Call ahead.",
      visitDate: "2026-03-15",
      helpfulCount: 12,
    },
  ],
};
