export const GEOIP: Record<string, { 
  lat: number; 
  lng: number; 
  city: string; 
  country: string;
  isThreat: boolean;
}> = {
  // Internal network — use a single origin point for all internal IPs
  // (they appear as one cluster on the map — the "home" network)
  "192.168.1.10":  { lat: 28.6139, lng: 77.2090,  city: "New Delhi",      country: "IN", isThreat: false },
  "192.168.1.45":  { lat: 28.6139, lng: 77.2090,  city: "New Delhi",      country: "IN", isThreat: false },
  "192.168.1.101": { lat: 28.6139, lng: 77.2090,  city: "New Delhi",      country: "IN", isThreat: false },
  "192.168.1.200": { lat: 28.6139, lng: 77.2090,  city: "New Delhi",      country: "IN", isThreat: false },
  "192.168.1.234": { lat: 28.6139, lng: 77.2090,  city: "New Delhi",      country: "IN", isThreat: false },
  "10.0.0.5":      { lat: 28.6139, lng: 77.2090,  city: "New Delhi",      country: "IN", isThreat: false },

  // External IPs
  "8.8.8.8":        { lat: 37.4056, lng: -122.0775, city: "Mountain View", country: "US", isThreat: false },
  "1.1.1.1":        { lat: -33.8688, lng: 151.2093, city: "Sydney",        country: "AU", isThreat: false },
  "93.184.216.34":  { lat: 42.3601, lng: -71.0589,  city: "Norwell MA",    country: "US", isThreat: false },
  "172.217.14.46":  { lat: 37.4056, lng: -122.0775, city: "Mountain View", country: "US", isThreat: false },
  "167.88.162.34":  { lat: 52.5200, lng: 13.4050,   city: "Berlin",        country: "DE", isThreat: true  },
  "185.220.101.45": { lat: 48.8566, lng: 2.3522,    city: "Paris",         country: "FR", isThreat: true  },
  "104.21.14.100":  { lat: 51.5074, lng: -0.1278,   city: "London",        country: "GB", isThreat: false },
  "151.101.1.140":  { lat: 37.7749, lng: -122.4194,  city: "San Francisco", country: "US", isThreat: false },
};
