import React, { useEffect, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import { AccessibilityPoint, PointType } from '../types';
import { PointIcon } from './icons/Icons';

// Quick fix for Leaflet global object not being typed
declare const L: any;

interface MapProps {
  points: AccessibilityPoint[];
  selectedPoint: AccessibilityPoint | null;
  onPointSelect: (point: AccessibilityPoint) => void;
  isAddingPoint?: boolean;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

const pointColors: Record<PointType, string> = {
    [PointType.RAMP]: 'bg-green-500 border-green-300',
    [PointType.ELEVATOR]: 'bg-blue-500 border-blue-300',
    [PointType.RESTROOM]: 'bg-yellow-500 border-yellow-300',
    [PointType.PARKING]: 'bg-indigo-500 border-indigo-300',
    [PointType.ENTRANCE]: 'bg-purple-500 border-purple-300',
    [PointType.UNKNOWN]: 'bg-gray-500 border-gray-300',
};

const pointTextColors: Record<PointType, string> = {
    [PointType.RESTROOM]: 'text-black',
    [PointType.RAMP]: 'text-white',
    [PointType.ELEVATOR]: 'text-white',
    [PointType.PARKING]: 'text-white',
    [PointType.ENTRANCE]: 'text-white',
    [PointType.UNKNOWN]: 'text-white',
};

const Map: React.FC<MapProps> = ({ points, selectedPoint, onPointSelect, isAddingPoint, onMapClick }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any | null>(null);
  const markersRef = useRef(new window.Map<string, any>());
  const prevSelectedId = useRef<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([-22.9099, -47.0626], 13); // Default to Campinas
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle map click for adding points
  useEffect(() => {
    if (!mapRef.current || !onMapClick) return;

    const handleClick = (e: any) => {
      if (isAddingPoint) {
        onMapClick(e.latlng);
      }
    };

    mapRef.current.on('click', handleClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleClick);
      }
    };
  }, [isAddingPoint, onMapClick]);
  
  // Change cursor style based on isAddingPoint
  useEffect(() => {
    const container = mapContainerRef.current;
    if (container) {
      if (isAddingPoint) {
        container.style.cursor = 'crosshair';
      } else {
        container.style.cursor = '';
      }
    }
  }, [isAddingPoint]);

  // Update markers when points change
  useEffect(() => {
    if (!mapRef.current) return;

    const currentMarkerIds = new Set(points.map(p => p.id));
    
    // Remove markers that are no longer in the points list
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    if (points.length === 0) return;

    const bounds: [number, number][] = [];

    points.forEach(point => {
      const existingMarker = markersRef.current.get(point.id);

      const iconHtml = point.customIcon
        ? ReactDOMServer.renderToString(
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${pointColors[point.type]}`}>
              <img src={point.customIcon} alt={point.name} className="w-full h-full rounded-full object-cover" />
            </div>
          )
        : ReactDOMServer.renderToString(
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${pointColors[point.type]} ${pointTextColors[point.type]}`}>
              <PointIcon type={point.type} />
            </div>
          );
      
      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-map-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (existingMarker) {
        // Just update icon, e.g., if customIcon changed
        existingMarker.setIcon(customIcon);
      } else {
        // Create new marker
        const marker = L.marker([point.position.lat, point.position.lng], { icon: customIcon })
          .addTo(mapRef.current)
          .on('click', () => {
            onPointSelect(point);
          });
        markersRef.current.set(point.id, marker);
      }
      
      bounds.push([point.position.lat, point.position.lng]);
    });

    if (bounds.length > 0 && !selectedPoint) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [points, onPointSelect, selectedPoint]);

  // Handle point selection
  useEffect(() => {
    if (!mapRef.current) return;

    // Deselect previous marker
    if (prevSelectedId.current) {
      const prevMarker = markersRef.current.get(prevSelectedId.current);
      prevMarker?.getElement()?.classList.remove('marker-selected');
    }

    // Select new marker
    if (selectedPoint) {
      const newMarker = markersRef.current.get(selectedPoint.id);
      if (newMarker) {
        newMarker.getElement()?.classList.add('marker-selected');
        mapRef.current.flyTo([selectedPoint.position.lat, selectedPoint.position.lng], 16, {
          animate: true,
          duration: 1,
        });
      }
    }

    prevSelectedId.current = selectedPoint?.id ?? null;
  }, [selectedPoint]);

  return (
    <>
      <style>{`
        .leaflet-container {
          background: #1e293b; /* bg-slate-800 */
        }
        .custom-map-icon {
          background: transparent;
          border: none;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .custom-map-icon > div {
           transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .custom-map-icon:hover > div {
          transform: scale(1.15);
        }
        .marker-selected .custom-map-icon > div {
            transform: scale(1.25);
            box-shadow: 0 0 0 3px #06b6d4, 0 0 15px #06b6d4; /* cyan-400 */
        }
      `}</style>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" aria-label="Mapa da cidade com pontos de acessibilidade"></div>
    </>
  );
};

export default Map;
