import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface MemoryLocationMapProps {
  lat: number;
  lng: number;
}

const MAP_STYLE = 'https://demotiles.maplibre.org/style.json'; // Light, neutral demo style

const MemoryLocationMap: React.FC<MemoryLocationMapProps> = ({ lat, lng }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return; // Prevent double init
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [lng, lat],
      zoom: 5,
      attributionControl: false,
      interactive: true,
    });
    mapRef.current = map;
    // Remove controls
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    // Add marker
    new maplibregl.Marker({ color: '#1976d2' })
      .setLngLat([lng, lat])
      .addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height: 200, borderRadius: 8, overflow: 'hidden', marginTop: 8 }}
      aria-label="Memory location map"
    />
  );
};

export default MemoryLocationMap; 