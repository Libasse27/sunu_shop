import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

// Fix Leaflet default marker icon broken by bundlers
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
});

interface GeoCoords {
  lat: number;
  lng: number;
  displayName: string;
}

interface Props {
  street: string;
  city: string;
  country: string;
  label?: string;
  mini?: boolean;
}

// Moves the map view when coords change
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15, { animate: true, duration: 0.8 });
  }, [center, map]);
  return null;
}

// Custom marker with primary color
const primaryMarker = new L.DivIcon({
  html: `
    <div style="
      width:32px;height:40px;position:relative;
      filter:drop-shadow(0 3px 6px rgba(0,0,0,0.25));
    ">
      <svg viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 10.627 14.222 23.18 15.285 24.1a1 1 0 001.43 0C17.778 39.18 32 26.627 32 16 32 7.163 24.837 0 16 0z" fill="#009A44"/>
        <circle cx="16" cy="16" r="7" fill="white"/>
        <circle cx="16" cy="16" r="4" fill="#009A44"/>
      </svg>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -42],
  className: '',
});

export default function AddressMap({ street, city, country, label, mini = false }: Props) {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fullAddress = [street, city, country].filter(Boolean).join(', ');

  useEffect(() => {
    if (fullAddress.trim().length < 8) {
      setStatus('idle');
      setCoords(null);
      return;
    }

    setStatus('loading');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&countrycodes=sn,ml,gn,ci,bf`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'fr', 'User-Agent': 'Sunu Shop/1.0' },
        });
        const data = await res.json();

        if (data && data.length > 0) {
          setCoords({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            displayName: data[0].display_name,
          });
          setStatus('found');
        } else {
          // Fallback: search by city + country only
          const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${city}, ${country}`)}&limit=1`;
          const fbRes = await fetch(fallbackUrl, {
            headers: { 'Accept-Language': 'fr', 'User-Agent': 'Sunu Shop/1.0' },
          });
          const fbData = await fbRes.json();
          if (fbData && fbData.length > 0) {
            setCoords({
              lat: parseFloat(fbData[0].lat),
              lng: parseFloat(fbData[0].lon),
              displayName: fbData[0].display_name,
            });
            setStatus('found');
          } else {
            setStatus('error');
          }
        }
      } catch {
        setStatus('error');
      }
    }, 900);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fullAddress, city, country]);

  const heightPx = mini ? 144 : 256;

  // Don't render anything if no input
  if (!street && !city) return null;

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-gray-100"
      style={{ height: heightPx, background: '#e9ecef' }}
    >
      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2"
          style={{ background: 'rgba(248,250,252,0.9)' }}>
          <Loader2 size={22} style={{ color: '#009A44' }} className="animate-spin" />
          <span className="text-sm text-gray-500">Localisation en cours...</span>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="absolute inset-0 z-20 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-500">
          <AlertCircle size={28} className="text-gray-500 opacity-50" />
          <span className="text-sm text-center px-6">Adresse introuvable — vérifiez la ville et le pays</span>
        </div>
      )}

      {/* Idle state (not enough input) */}
      {status === 'idle' && (
        <div className="absolute inset-0 z-20 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-500">
          <MapPin size={28} className="text-gray-500 opacity-50" />
          <span className="text-sm">Saisissez une adresse pour l'afficher sur la carte</span>
        </div>
      )}

      {/* Map */}
      {status === 'found' && coords && (
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={15}
          style={{ width: '100%', height: '100%' }}
          zoomControl={!mini}
          scrollWheelZoom={false}
          attributionControl={!mini}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={[coords.lat, coords.lng]} icon={primaryMarker}>
            <Popup>
              <div className="text-sm leading-relaxed" style={{ maxWidth: 180 }}>
                <p className="font-bold text-gray-900 mb-1">{label || 'Mon adresse'}</p>
                <p className="text-gray-500 mb-0">{street}</p>
                <p className="text-gray-500 mb-0">{city}, {country}</p>
              </div>
            </Popup>
          </Marker>
          <MapController center={[coords.lat, coords.lng]} />
        </MapContainer>
      )}

      {/* Map label badge (shown when map is visible) */}
      {status === 'found' && !mini && (
        <div
          className="absolute top-0 left-0 mt-3 ml-3 flex items-center gap-2 text-sm font-semibold text-gray-900 shadow-sm rounded-lg px-3 py-1 pointer-events-none"
          style={{ zIndex: 1000, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}
        >
          <MapPin size={12} style={{ color: '#009A44' }} />
          {city}, {country}
        </div>
      )}
    </div>
  );
}
