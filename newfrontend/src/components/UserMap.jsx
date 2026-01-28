// // // File: src/components/UserMap.js
// // import React, { useEffect } from 'react';
// // import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
// // import 'leaflet/dist/leaflet.css';
// // import L from 'leaflet';

// // // --- Fix Broken Markers in React-Leaflet ---
// // import icon from 'leaflet/dist/images/marker-icon.png';
// // import iconShadow from 'leaflet/dist/images/marker-shadow.png';
// // let DefaultIcon = L.icon({
// //     iconUrl: icon,
// //     shadowUrl: iconShadow,
// //     iconSize: [25, 41],
// //     iconAnchor: [12, 41]
// // });
// // L.Marker.prototype.options.icon = DefaultIcon;

// // // Helper to auto-zoom map
// // const MapUpdater = ({ center, zoom }) => {
// //   const map = useMap();
// //   useEffect(() => {
// //     map.setView(center, zoom);
// //   }, [center, zoom, map]);
// //   return null;
// // };

// // const UserMap = ({ location, routes = [] }) => {
// //   // Default: Center of India
// //   let center = [20.5937, 78.9629]; 
// //   let zoom = 5;

// //   // If location is provided object {lat, lng}
// //   if (location && location.lat) {
// //      center = [location.lat, location.lng];
// //      zoom = 11;
// //   }

// //   return (
// //     <div className="h-full w-full bg-gray-200">
// //       <MapContainer key={`${center[0]}-${center[1]}`} center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
// //         <TileLayer 
// //             attribution='&copy; OpenStreetMap' 
// //             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
// //         />
        
// //         {/* Update View when props change */}
// //         <MapUpdater center={center} zoom={zoom} />

// //         {/* Draw AI Routes */}
// //         {routes.map((r) => (
// //             <Polyline 
// //                 key={r.id} 
// //                 positions={r.coordinates} 
// //                 pathOptions={{ color: r.color, weight: 6, opacity: 0.8 }} 
// //             >
// //                 <Popup>{r.label}: {r.duration}</Popup>
// //             </Polyline>
// //         ))}

// //         {/* Start/End Markers */}
// //         {routes.length > 0 && (
// //            <>
// //              <Marker position={routes[0].coordinates[0]}><Popup>Start</Popup></Marker>
// //              <Marker position={routes[0].coordinates[routes[0].coordinates.length - 1]}><Popup>End</Popup></Marker>
// //            </>
// //         )}
// //       </MapContainer>
// //     </div>
// //   );
// // };

// // export default UserMap;



// import React, { useEffect, useRef } from 'react';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// // --- Fix Broken Markers (Leaflet Standard Fix) ---
// import icon from 'leaflet/dist/images/marker-icon.png';
// import iconShadow from 'leaflet/dist/images/marker-shadow.png';
// let DefaultIcon = L.icon({
//     iconUrl: icon,
//     shadowUrl: iconShadow,
//     iconSize: [25, 41],
//     iconAnchor: [12, 41]
// });
// L.Marker.prototype.options.icon = DefaultIcon;

// const UserMap = ({ location, routes = [] }) => {
//   const mapContainerRef = useRef(null); // Reference to the <div>
//   const mapInstanceRef = useRef(null);  // Reference to the L.map instance
//   const routeLayerRef = useRef(null);   // Reference to store route lines

//   // 1. Initialize Map (Only once!)
//   useEffect(() => {
//     if (mapInstanceRef.current) return; // 🛑 STOP if map already exists (Prevents Crash)

//     // Default Center: India
//     const initialCenter = [20.5937, 78.9629];
//     const initialZoom = 5;

//     // Create Map
//     const map = L.map(mapContainerRef.current).setView(initialCenter, initialZoom);

//     // Add Tile Layer
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '&copy; OpenStreetMap contributors'
//     }).addTo(map);

//     // Save instance to ref
//     mapInstanceRef.current = map;
//     routeLayerRef.current = L.layerGroup().addTo(map);

//     // Cleanup on unmount
//     return () => {
//       map.remove();
//       mapInstanceRef.current = null;
//     };
//   }, []);

//   // 2. Handle Location Updates (Pan the map)
//   useEffect(() => {
//     const map = mapInstanceRef.current;
//     if (!map || !location) return;

//     if (location.lat && location.lng) {
//       map.flyTo([location.lat, location.lng], 12, { duration: 1.5 });
//     }
//   }, [location]);

//   // 3. Handle Routes (Draw lines)
//   useEffect(() => {
//     const map = mapInstanceRef.current;
//     const layerGroup = routeLayerRef.current;
    
//     if (!map || !layerGroup) return;

//     // Clear old routes
//     layerGroup.clearLayers();

//     routes.forEach(route => {
//       // Draw Line
//       const polyline = L.polyline(route.coordinates, {
//         color: route.color || 'blue',
//         weight: 6,
//         opacity: 0.8
//       }).addTo(layerGroup);

//       // Add Popup
//       polyline.bindPopup(`<b>${route.label}</b><br>${route.distance} • ${route.duration}`);

//       // Add Markers for Start/End
//       if (route.coordinates.length > 0) {
//         L.marker(route.coordinates[0]).addTo(layerGroup).bindPopup("Start");
//         L.marker(route.coordinates[route.coordinates.length - 1]).addTo(layerGroup).bindPopup("End");
//       }
      
//       // Auto-fit bounds
//       map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
//     });

//   }, [routes]);

//   return (
//     // The Map Container Div
//     <div 
//       ref={mapContainerRef} 
//       style={{ height: '100%', width: '100%', background: '#e5e7eb' }} 
//     />
//   );
// };

// export default UserMap;



import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Standard Leaflet Icon Fix ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const UserMap = ({ location, vehicles = [] }) => {
  const mapContainerRef = useRef(null); // The div
  const mapInstanceRef = useRef(null);  // The map
  const markersLayerRef = useRef(null); // Layer group for vehicle markers

  // 1. Initialize Map (Runs once)
  useEffect(() => {
    if (mapInstanceRef.current) return; // Prevent double-init crash

    // Default Center (India)
    const initialCenter = [20.5937, 78.9629];
    const initialZoom = 5;

    const map = L.map(mapContainerRef.current).setView(initialCenter, initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
    // create a layer group for vehicle markers
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Update vehicle markers when `vehicles` changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    // Clear existing markers
    layer.clearLayers();

    // Add marker for every vehicle
    vehicles.forEach(v => {
      if (!v || !v.location) return;
      const lat = v.location.lat;
      const lng = v.location.lng;
      if (lat == null || lng == null) return;

      const marker = L.marker([lat, lng]);
      marker.bindPopup(`<b>${v.name}</b><br/>${v.plate || ''}<br/>Status: ${v.status}`);
      marker.addTo(layer);
    });

  }, [vehicles]);

  // 3. Pan/fly to `location` when it changes (single selected location)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !location || !location.lat) return;
    const newLatLng = [location.lat, location.lng];
    map.flyTo(newLatLng, 13, { duration: 1.0 });
  }, [location]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '100%', width: '100%', background: '#e5e7eb' }} 
    />
  );
};

export default UserMap;