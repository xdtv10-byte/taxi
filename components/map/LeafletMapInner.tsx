'use client';

import { useEffect, useRef } from 'react';
import type { GeoPoint } from '@/types';

export type LeafletMapInnerProps = {
  center: [number, number];
  zoom?: number;
  pickupLocation?: GeoPoint | null;
  dropoffLocation?: GeoPoint | null;
  driverLocation?: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
};

// ✅ الأيقونات تُنشأ داخل الـ component بعد mount (ليس على مستوى الـ module)
// لأن L.divIcon يحتاج window وهو غير موجود في SSR
function createIcons(L: any) {
  const pickupIcon = L.divIcon({
    html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#00d4aa;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  const dropoffIcon = L.divIcon({
    html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#ef4444;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  const driverIcon = L.divIcon({
    html: `<div style="width:36px;height:36px;border-radius:50%;background:#00d4aa;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,212,170,0.6);"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H6L4 10l-2.5 1.1C1.7 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  return { pickupIcon, dropoffIcon, driverIcon };
}

export default function LeafletMapInner({
  center,
  zoom = 13,
  pickupLocation,
  dropoffLocation,
  driverLocation,
  onMapClick,
  height = '400px',
}: LeafletMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const dropoffMarkerRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const iconsRef = useRef<ReturnType<typeof createIcons> | null>(null);

  // ✅ تهيئة الخريطة — فقط في المتصفح بعد mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let mounted = true;

    (async () => {
      // استيراد Leaflet ديناميكياً — يضمن أنه لا يعمل في SSR
      const L = (await import('leaflet')).default;

      // Inject Leaflet CSS via link tag (avoids TypeScript module resolution issues)
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mounted || !containerRef.current) return;

      iconsRef.current = createIcons(L);

      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      if (onMapClick) {
        map.on('click', (e: any) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تحديث مركز الخريطة
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom);
  }, [center, zoom]);

  // تحديث marker نقطة الانطلاق
  useEffect(() => {
    const map = mapRef.current;
    const icons = iconsRef.current;
    if (!map || !icons) return;

    if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }
    if (pickupLocation) {
      pickupMarkerRef.current = (window as any).L
        ? null
        : null;
      import('leaflet').then(({ default: L }) => {
        if (!map) return;
        pickupMarkerRef.current = L.marker(
          [pickupLocation.lat, pickupLocation.lng],
          { icon: icons.pickupIcon }
        ).addTo(map).bindPopup(pickupLocation.address);
      });
    }
  }, [pickupLocation]);

  // تحديث marker الوجهة
  useEffect(() => {
    const map = mapRef.current;
    const icons = iconsRef.current;
    if (!map || !icons) return;

    if (dropoffMarkerRef.current) {
      map.removeLayer(dropoffMarkerRef.current);
      dropoffMarkerRef.current = null;
    }
    if (dropoffLocation) {
      import('leaflet').then(({ default: L }) => {
        if (!map) return;
        dropoffMarkerRef.current = L.marker(
          [dropoffLocation.lat, dropoffLocation.lng],
          { icon: icons.dropoffIcon }
        ).addTo(map).bindPopup(dropoffLocation.address);
      });
    }
  }, [dropoffLocation]);

  // تحديث marker السائق
  useEffect(() => {
    const map = mapRef.current;
    const icons = iconsRef.current;
    if (!map || !icons) return;

    if (driverMarkerRef.current) {
      map.removeLayer(driverMarkerRef.current);
      driverMarkerRef.current = null;
    }
    if (driverLocation) {
      import('leaflet').then(({ default: L }) => {
        if (!map) return;
        driverMarkerRef.current = L.marker(
          [driverLocation.lat, driverLocation.lng],
          { icon: icons.driverIcon }
        ).addTo(map);
      });
    }
  }, [driverLocation]);

  // رسم خط المسار
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeRef.current) {
      map.removeLayer(routeRef.current);
      routeRef.current = null;
    }

    if (pickupLocation && dropoffLocation) {
      import('leaflet').then(({ default: L }) => {
        if (!map) return;
        routeRef.current = L.polyline(
          [
            [pickupLocation.lat, pickupLocation.lng],
            [dropoffLocation.lat, dropoffLocation.lng],
          ],
          { color: '#00d4aa', weight: 4, opacity: 0.7, dashArray: '8,8' }
        ).addTo(map);

        const bounds = L.latLngBounds([
          [pickupLocation.lat, pickupLocation.lng],
          [dropoffLocation.lat, dropoffLocation.lng],
        ]);
        if (driverLocation) bounds.extend([driverLocation.lat, driverLocation.lng]);
        map.fitBounds(bounds, { padding: [40, 40] });
      });
    }
  }, [pickupLocation, dropoffLocation, driverLocation]);

  return <div ref={containerRef} style={{ height, width: '100%' }} />;
}
