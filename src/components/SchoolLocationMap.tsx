import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, School as SchoolIcon, Phone, ExternalLink } from 'lucide-react';
import {
  GOOGLE_MAPS_API_KEY,
  GMP_INTERNAL_ATTRIBUTION_IDS,
  INSTITUTION_DEFAULT_COORDINATES,
} from '../lib/googleMapsConfig.ts';

interface SchoolLocationMapProps {
  schoolName?: string;
  address?: string;
  phone?: string;
  coordinates?: { lat: number; lng: number };
  interactive?: boolean;
  className?: string;
}

export const SchoolLocationMap: React.FC<SchoolLocationMapProps> = ({
  schoolName = 'Bright Future Secondary School',
  address = '12 Education Crescent, Off Victoria Island Rd, Lagos',
  phone = '+234 802 345 6789',
  coordinates = INSTITUTION_DEFAULT_COORDINATES,
  interactive = true,
  className = 'h-72 w-full',
}) => {
  const [openInfo, setOpenInfo] = useState(true);

  return (
    <div className="w-full bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold text-stone-200 uppercase tracking-wider">
            Verified School Campus Location
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Google Maps Live
        </span>
      </div>

      <div className={`relative ${className}`}>
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            id="schoolcore-campus-map"
            defaultCenter={coordinates}
            defaultZoom={14}
            gestureHandling={interactive ? 'auto' : 'none'}
            disableDefaultUI={!interactive}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={GMP_INTERNAL_ATTRIBUTION_IDS}
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedMarker
              position={coordinates}
              onClick={() => setOpenInfo(!openInfo)}
              title={schoolName}
            >
              <Pin
                background="#059669"
                borderColor="#047857"
                glyphColor="#ffffff"
                scale={1.1}
              />
            </AdvancedMarker>

            {openInfo && (
              <InfoWindow
                position={coordinates}
                onCloseClick={() => setOpenInfo(false)}
                headerContent={
                  <div className="flex items-center gap-1.5 font-medium text-xs text-stone-900">
                    <SchoolIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{schoolName}</span>
                  </div>
                }
              >
                <div className="p-1 max-w-xs text-stone-800">
                  <p className="text-xs text-stone-600 leading-relaxed mb-2">{address}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200 text-[11px]">
                    <span className="text-stone-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-stone-400" />
                      {phone}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                      Directions
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      <div className="p-3 bg-stone-950/80 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-stone-500" />
          <span className="truncate max-w-md">{address}</span>
        </div>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors"
        >
          <span>Get Directions</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
