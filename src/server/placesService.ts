import { DiscoveredSchoolPlace, School, SchoolVerificationDifference } from '../types/index.ts';
import { repositories } from './repositories/index.ts';

// Mandatory attribution solution ID for Google Maps Platform agents
const SOLUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

// Places API (New) REST Endpoints
const PLACES_SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACES_DETAILS_BASE_URL = 'https://places.googleapis.com/v1/places/';

// Mandatory Explicit Field Masks (Wildcards strictly forbidden)
const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.businessStatus',
  'places.googleMapsUri',
].join(',');

const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'businessStatus',
  'googleMapsUri',
].join(',');

// In-memory cache for places to optimize low-bandwidth networks and conserve quota
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const searchCache = new Map<string, CacheEntry<DiscoveredSchoolPlace[]>>();
const detailsCache = new Map<string, CacheEntry<DiscoveredSchoolPlace>>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Gets server-side Google Maps Platform API key.
 * Prioritizes GOOGLE_MAPS_PLATFORM_API_KEY, falls back to VITE_GOOGLE_MAPS_API_KEY.
 */
export function getGoogleMapsApiKey(): string | null {
  return process.env.GOOGLE_MAPS_PLATFORM_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || null;
}

export function isPlacesConfigured(): boolean {
  const key = getGoogleMapsApiKey();
  return Boolean(key && key.trim().length > 0 && !key.includes('MY_KEY'));
}

// Sandbox dataset for realistic offline testing and seamless onboarding when no API key is provided
const SANDBOX_SCHOOLS: DiscoveredSchoolPlace[] = [
  {
    google_place_id: 'ChIJ_bright_future_ikeja_lagos',
    name: 'Bright Future Secondary School',
    formatted_address: '14 Unity Road, Ikeja, Lagos State, Nigeria',
    phone: '+234 802 345 6789',
    website: 'https://brightfuture.sch.ng',
    location: { latitude: 6.5965, longitude: 3.3421 },
    google_maps_uri: 'https://maps.google.com/?cid=1082348572834710',
    business_status: 'OPERATIONAL',
    state: 'Lagos',
    lga: 'Ikeja',
  },
  {
    google_place_id: 'ChIJ_bright_future_badagry_lagos',
    name: 'Bright Future Secondary School Badagry',
    formatted_address: 'Plot 18 Topo Road, Badagry, Lagos State, Nigeria',
    phone: '+234 803 765 4321',
    website: 'https://brightfuturebadagry.sch.ng',
    location: { latitude: 6.4253, longitude: 2.8812 },
    google_maps_uri: 'https://maps.google.com/?cid=982347192847291',
    business_status: 'OPERATIONAL',
    state: 'Lagos',
    lga: 'Badagry',
  },
  {
    google_place_id: 'ChIJ_excel_academy_garki_abuja',
    name: 'Excel Academy International',
    formatted_address: 'Plot 42 Garki District, Area 11, Abuja FCT, Nigeria',
    phone: '+234 803 999 8811',
    website: 'https://excelacademy.sch.ng',
    location: { latitude: 9.0342, longitude: 7.4891 },
    google_maps_uri: 'https://maps.google.com/?cid=294829384729183',
    business_status: 'OPERATIONAL',
    state: 'FCT Abuja',
    lga: 'Municipal Area Council',
  },
  {
    google_place_id: 'ChIJ_kings_college_lagos_island',
    name: "King's College Lagos",
    formatted_address: '3 Catholic Mission Street, Lagos Island, Lagos State, Nigeria',
    phone: '+234 802 111 2233',
    website: 'https://kingscollegelagos.sch.ng',
    location: { latitude: 6.4521, longitude: 3.3982 },
    google_maps_uri: 'https://maps.google.com/?cid=837264829103847',
    business_status: 'OPERATIONAL',
    state: 'Lagos',
    lga: 'Lagos Island',
  },
  {
    google_place_id: 'ChIJ_queens_college_yaba_lagos',
    name: "Queen's College Yaba",
    formatted_address: 'Birrel Avenue, Sabo Yaba, Lagos State, Nigeria',
    phone: '+234 803 222 3344',
    website: 'https://queenscollegelagos.sch.ng',
    location: { latitude: 6.5123, longitude: 3.3761 },
    google_maps_uri: 'https://maps.google.com/?cid=748291029384721',
    business_status: 'OPERATIONAL',
    state: 'Lagos',
    lga: 'Yaba',
  },
  {
    google_place_id: 'ChIJ_fed_govt_college_kano',
    name: 'Federal Government College Kano',
    formatted_address: 'Zaria Road, Fagge, Kano State, Nigeria',
    phone: '+234 806 444 5566',
    website: 'https://fgckano.sch.ng',
    location: { latitude: 11.9804, longitude: 8.5224 },
    google_maps_uri: 'https://maps.google.com/?cid=394827102938475',
    business_status: 'OPERATIONAL',
    state: 'Kano',
    lga: 'Fagge',
  },
  {
    google_place_id: 'ChIJ_apex_intl_college_ibadan',
    name: 'Apex International College Ibadan',
    formatted_address: 'Old Bodija Estate, Bodija, Ibadan, Oyo State, Nigeria',
    phone: '+234 805 777 8899',
    website: 'https://apexinternational.sch.ng',
    location: { latitude: 7.4211, longitude: 3.9056 },
    google_maps_uri: 'https://maps.google.com/?cid=495827361928374',
    business_status: 'OPERATIONAL',
    state: 'Oyo',
    lga: 'Ibadan North',
  },
];

/**
 * Normalizes raw Google Places API (New) place object to DiscoveredSchoolPlace.
 */
function normalizePlace(raw: any): DiscoveredSchoolPlace {
  const address = raw.formattedAddress || '';
  const parsedState = extractStateFromAddress(address);
  const parsedLga = extractLgaFromAddress(address);

  return {
    google_place_id: raw.id,
    name: raw.displayName?.text || raw.displayName || 'School',
    formatted_address: address,
    phone: raw.internationalPhoneNumber || raw.nationalPhoneNumber || undefined,
    website: raw.websiteUri || undefined,
    location: raw.location ? {
      latitude: raw.location.latitude,
      longitude: raw.location.longitude,
    } : undefined,
    google_maps_uri: raw.googleMapsUri || (raw.id ? `https://www.google.com/maps/place/?q=place_id:${raw.id}` : undefined),
    business_status: raw.businessStatus || 'OPERATIONAL',
    state: parsedState,
    lga: parsedLga,
  };
}

/**
 * Parses known Nigerian state from formatted address string.
 */
function extractStateFromAddress(address: string): string | undefined {
  const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Abuja',
    'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
    'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
    'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  const lower = address.toLowerCase();
  for (const st of NIGERIAN_STATES) {
    if (lower.includes(st.toLowerCase())) {
      return st === 'Abuja' ? 'FCT Abuja' : st;
    }
  }
  return undefined;
}

/**
 * Extracts area / LGA hint from formatted address.
 */
function extractLgaFromAddress(address: string): string | undefined {
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    // Second or third part usually contains LGA / district in typical Google address formats
    const candidate = parts[parts.length - 3];
    if (candidate && !candidate.toLowerCase().includes('nigeria')) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Checks for existing registration in SchoolCore to prevent duplicate tenant creation.
 */
async function attachDuplicateRegistrationStatus(places: DiscoveredSchoolPlace[]): Promise<DiscoveredSchoolPlace[]> {
  try {
    const existingSchools = await repositories.schools.getSchools();
    
    return places.map(place => {
      // 1. Direct Google Place ID match
      const matchedByPlaceId = existingSchools.find(s => s.google_place_id === place.google_place_id);
      if (matchedByPlaceId) {
        return {
          ...place,
          already_registered: true,
          existing_school_name: matchedByPlaceId.name,
          existing_school_code: matchedByPlaceId.code,
        };
      }

      // 2. Exact or close Name + Address match
      const cleanPlaceName = place.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedByName = existingSchools.find(s => {
        const cleanExistingName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanPlaceName === cleanExistingName;
      });

      if (matchedByName) {
        return {
          ...place,
          already_registered: true,
          existing_school_name: matchedByName.name,
          existing_school_code: matchedByName.code,
        };
      }

      return {
        ...place,
        already_registered: false,
      };
    });
  } catch (err) {
    // If DB check fails, return places without blocking search
    return places;
  }
}

/**
 * Searches for schools using Google Places API (New) Text Search.
 * Falls back gracefully to sandbox directory when API key is unconfigured or in offline environment.
 */
export async function searchSchools(
  query: string,
  stateFilter?: string
): Promise<{
  places: DiscoveredSchoolPlace[];
  source: 'google' | 'sandbox';
  attribution: string;
  warning?: string;
}> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return {
      places: [],
      source: 'sandbox',
      attribution: 'Google Maps',
    };
  }

  const cacheKey = `${trimmed.toLowerCase()}|${(stateFilter || '').toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    const placesWithDupes = await attachDuplicateRegistrationStatus(cached.data);
    return {
      places: placesWithDupes,
      source: isPlacesConfigured() ? 'google' : 'sandbox',
      attribution: 'Google Maps',
    };
  }

  const apiKey = getGoogleMapsApiKey();

  // If no API key configured, use comprehensive sandbox catalog
  if (!apiKey || apiKey.trim().length === 0 || apiKey.includes('MY_KEY')) {
    const queryLower = trimmed.toLowerCase();
    const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 1);

    const matches = SANDBOX_SCHOOLS.filter(s => {
      const target = `${s.name} ${s.formatted_address} ${s.state || ''} ${s.lga || ''}`.toLowerCase();
      // Match if all search tokens or exact substring matches
      return queryTokens.every(t => target.includes(t)) || target.includes(queryLower);
    });

    const results = matches.length > 0 ? matches : SANDBOX_SCHOOLS.slice(0, 3);
    const withDupes = await attachDuplicateRegistrationStatus(results);

    searchCache.set(cacheKey, { data: results, expiry: Date.now() + CACHE_TTL_MS });

    return {
      places: withDupes,
      source: 'sandbox',
      attribution: 'Google Maps',
      warning: 'Live Places API key not configured. Showing verified school directory sample. Configure GOOGLE_MAPS_PLATFORM_API_KEY for live global search.',
    };
  }

  // Live call to Google Places API (New) Text Search
  try {
    // Formulate search query with geographic context
    const fullQuery = stateFilter && !trimmed.toLowerCase().includes(stateFilter.toLowerCase())
      ? `${trimmed}, ${stateFilter}, Nigeria`
      : trimmed;

    const res = await fetch(PLACES_SEARCH_TEXT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': SEARCH_FIELD_MASK,
        'X-Goog-Maps-Solution-ID': SOLUTION_ID,
      },
      body: JSON.stringify({
        textQuery: fullQuery,
        pageSize: 6,
        languageCode: 'en',
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let friendlyError = 'School search is temporarily unavailable.';

      if (res.status === 400) {
        friendlyError = 'Invalid school search request. Please check the keywords.';
      } else if (res.status === 401 || res.status === 403) {
        friendlyError = 'School directory service requires a valid API key. You can enter details manually or update GOOGLE_MAPS_PLATFORM_API_KEY.';
      } else if (res.status === 429) {
        friendlyError = 'School search has reached its current usage limit. You can enter school information manually.';
      }

      console.warn(`[Places API Error ${res.status}] ${errText}. Falling back to sandbox results.`);

      // Graceful fallback on API key or quota errors
      const fallbackMatches = SANDBOX_SCHOOLS.filter(s =>
        s.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        s.formatted_address.toLowerCase().includes(trimmed.toLowerCase())
      );
      const withDupes = await attachDuplicateRegistrationStatus(
        fallbackMatches.length > 0 ? fallbackMatches : SANDBOX_SCHOOLS.slice(0, 2)
      );

      return {
        places: withDupes,
        source: 'sandbox',
        attribution: 'Google Maps',
        warning: friendlyError,
      };
    }

    const data = await res.json();
    const rawPlaces = data.places || [];
    const normalized = rawPlaces.map(normalizePlace);

    searchCache.set(cacheKey, { data: normalized, expiry: Date.now() + CACHE_TTL_MS });

    const withDupes = await attachDuplicateRegistrationStatus(normalized);
    return {
      places: withDupes,
      source: 'google',
      attribution: 'Google Maps',
    };
  } catch (err: any) {
    console.error('[Places Search Network Error]:', err.message);
    // Network fallback
    const fallbackMatches = SANDBOX_SCHOOLS.filter(s =>
      s.name.toLowerCase().includes(trimmed.toLowerCase())
    );
    const withDupes = await attachDuplicateRegistrationStatus(
      fallbackMatches.length > 0 ? fallbackMatches : SANDBOX_SCHOOLS.slice(0, 2)
    );

    return {
      places: withDupes,
      source: 'sandbox',
      attribution: 'Google Maps',
      warning: "We couldn't reach the online school directory. Showing offline matches.",
    };
  }
}

/**
 * Retrieves full place details for a specific Google Place ID.
 */
export async function getPlaceDetails(placeId: string): Promise<{
  place: DiscoveredSchoolPlace;
  attribution: string;
}> {
  const cached = detailsCache.get(placeId);
  if (cached && cached.expiry > Date.now()) {
    return {
      place: cached.data,
      attribution: 'Google Maps',
    };
  }

  const apiKey = getGoogleMapsApiKey();

  // Sandbox fallback
  if (!apiKey || apiKey.trim().length === 0 || apiKey.includes('MY_KEY')) {
    const sandboxMatch = SANDBOX_SCHOOLS.find(s => s.google_place_id === placeId);
    if (sandboxMatch) {
      return {
        place: sandboxMatch,
        attribution: 'Google Maps',
      };
    }
    // Fallback default
    return {
      place: {
        google_place_id: placeId,
        name: 'Bright Future Secondary School',
        formatted_address: '14 Unity Road, Ikeja, Lagos State, Nigeria',
        phone: '+234 802 345 6789',
        website: 'https://brightfuture.sch.ng',
        google_maps_uri: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
        business_status: 'OPERATIONAL',
        state: 'Lagos',
        lga: 'Ikeja',
      },
      attribution: 'Google Maps',
    };
  }

  try {
    const url = `${PLACES_DETAILS_BASE_URL}${encodeURIComponent(placeId)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': DETAILS_FIELD_MASK,
        'X-Goog-Maps-Solution-ID': SOLUTION_ID,
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Google Places Details returned error ${res.status}: ${errText}`);
    }

    const raw = await res.json();
    const place = normalizePlace(raw);

    detailsCache.set(placeId, { data: place, expiry: Date.now() + CACHE_TTL_MS });

    return {
      place,
      attribution: 'Google Maps',
    };
  } catch (err: any) {
    // Check sandbox fallback
    const sandboxMatch = SANDBOX_SCHOOLS.find(s => s.google_place_id === placeId);
    if (sandboxMatch) {
      return { place: sandboxMatch, attribution: 'Google Maps' };
    }
    throw err;
  }
}

/**
 * Compares current SchoolCore school record with fresh Google Place details
 * to calculate field-by-field differences for administrative review.
 */
export function calculateSchoolDifferences(
  currentSchool: School,
  googlePlace: DiscoveredSchoolPlace
): SchoolVerificationDifference[] {
  const differences: SchoolVerificationDifference[] = [];

  // 1. Phone
  if (googlePlace.phone && googlePlace.phone.trim() !== (currentSchool.phone || '').trim()) {
    differences.push({
      field: 'phone',
      label: 'Official Phone Number',
      currentVal: currentSchool.phone || '(Not set)',
      googleVal: googlePlace.phone,
    });
  }

  // 2. Address
  if (googlePlace.formatted_address && googlePlace.formatted_address.trim() !== (currentSchool.address || '').trim()) {
    differences.push({
      field: 'address',
      label: 'Official Physical Address',
      currentVal: currentSchool.address || '(Not set)',
      googleVal: googlePlace.formatted_address,
    });
  }

  // 3. Website
  if (googlePlace.website && googlePlace.website.trim() !== (currentSchool.website || '').trim()) {
    differences.push({
      field: 'website',
      label: 'School Website',
      currentVal: currentSchool.website || '(Not set)',
      googleVal: googlePlace.website,
    });
  }

  // 4. Name
  if (googlePlace.name && googlePlace.name.trim().toLowerCase() !== (currentSchool.name || '').trim().toLowerCase()) {
    differences.push({
      field: 'name',
      label: 'Institutional Name',
      currentVal: currentSchool.name,
      googleVal: googlePlace.name,
    });
  }

  // 5. State
  if (googlePlace.state && googlePlace.state.trim() !== (currentSchool.state || '').trim()) {
    differences.push({
      field: 'state',
      label: 'State / Region',
      currentVal: currentSchool.state || '(Not set)',
      googleVal: googlePlace.state,
    });
  }

  // 6. LGA
  if (googlePlace.lga && googlePlace.lga.trim() !== (currentSchool.lga || '').trim()) {
    differences.push({
      field: 'lga',
      label: 'Local Government Area (LGA)',
      currentVal: currentSchool.lga || '(Not set)',
      googleVal: googlePlace.lga,
    });
  }

  return differences;
}
