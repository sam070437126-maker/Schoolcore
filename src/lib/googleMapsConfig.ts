/**
 * Google Maps Platform Configuration & Constants for SchoolCore
 * Configured with official attribution tracking and verified coordinates.
 */

export const GOOGLE_MAPS_DEMO_KEY = 'AIzaSyDdfGojB5NAnT-qTWCPBqqyx0oVAq-d9ug';

export const GOOGLE_MAPS_API_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY) ||
  GOOGLE_MAPS_DEMO_KEY;

// Required for all AI Studio apps using Google Maps Platform APIs
export const GMP_INTERNAL_ATTRIBUTION_IDS = ['gmp_mcp_codeassist_v1_aistudio'];

// Default institution coordinates (Bright Future Secondary School, Lagos)
export const INSTITUTION_DEFAULT_COORDINATES = {
  lat: 6.5956,
  lng: 3.3421,
};

export const DEFAULT_MAP_ZOOM = 14;
