import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { vehicleService } from '../services/services';

// Fix default marker icon path
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [20, 28],
  iconAnchor: [10, 28]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Heatmap = ({ pollInterval = 5000 }) => {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const controlsRef = useRef(null);
  const [showHeat, setShowHeat] = useState(() => {
    try { return JSON.parse(localStorage.getItem('heatmap_showHeat')) ?? true; } catch { return true; }
  });
  const [showClusters, setShowClusters] = useState(() => {
    try { return JSON.parse(localStorage.getItem('heatmap_showClusters')) ?? true; } catch { return true; }
  });
  const [showVehicles, setShowVehicles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('heatmap_showVehicles')) ?? false; } catch { return false; }
  });

  useEffect(() => {
    if (mapRef.current) return;

    const initialCenter = [20.5937, 78.9629];
    const initialZoom = 5;

    const map = L.map('admin-heatmap').setView(initialCenter, initialZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Custom control for toggles
    const Controls = L.Control.extend({
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar p-2 bg-white rounded shadow');
        container.style.minWidth = '180px';
        container.innerHTML = `
          <div style="font-weight:600;margin-bottom:6px">Heatmap Layers</div>
          <label style="display:flex;align-items:center;margin-bottom:4px"><input id="hm_showHeat" type="checkbox" style="margin-right:6px" />Intensity</label>
          <label style="display:flex;align-items:center;margin-bottom:4px"><input id="hm_showClusters" type="checkbox" style="margin-right:6px" />Clusters</label>
          <label style="display:flex;align-items:center"><input id="hm_showVehicles" type="checkbox" style="margin-right:6px" />Vehicles</label>
        `;
        L.DomEvent.disableClickPropagation(container);
        return container;
      }
    });

    controlsRef.current = new Controls({ position: 'topright' }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync UI checkboxes with state
  useEffect(() => {
    const sync = () => {
      const elHeat = document.getElementById('hm_showHeat');
      const elClusters = document.getElementById('hm_showClusters');
      const elVehicles = document.getElementById('hm_showVehicles');
      if (elHeat) elHeat.checked = showHeat;
      if (elClusters) elClusters.checked = showClusters;
      if (elVehicles) elVehicles.checked = showVehicles;

      if (elHeat) elHeat.onchange = () => { setShowHeat(elHeat.checked); localStorage.setItem('heatmap_showHeat', JSON.stringify(elHeat.checked)); };
      if (elClusters) elClusters.onchange = () => { setShowClusters(elClusters.checked); localStorage.setItem('heatmap_showClusters', JSON.stringify(elClusters.checked)); };
      if (elVehicles) elVehicles.onchange = () => { setShowVehicles(elVehicles.checked); localStorage.setItem('heatmap_showVehicles', JSON.stringify(elVehicles.checked)); };
    };
    // slight delay to ensure control rendered
    const id = setTimeout(sync, 50);
    return () => clearTimeout(id);
  }, [showHeat, showClusters, showVehicles]);

  // Helper: color scale from green -> yellow -> red
  const colorFor = (t) => {
    const r = Math.round(255 * t);
    const g = Math.round(200 * (1 - t));
    return `rgb(${r},${g},50)`;
  };

  // Validate lat/lng: ignore only clearly invalid values (non-finite, placeholder 0,0, or out-of-range)
  const isValidLatLng = (lat, lng) => {
    if (!isFinite(lat) || !isFinite(lng)) return false;
    if (lat === 0 && lng === 0) return false; // very common invalid placeholder
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    return true;
  };

  // Try multiple vehicle fields for coordinates and fall back to deterministic simulated coords
  const getLatLngFromVehicle = (v) => {
    // Common server-side fields
    const candidates = [];
    if (v.currentLatitude != null && v.currentLongitude != null) candidates.push([Number(v.currentLatitude), Number(v.currentLongitude)]);
    if (v.latitude != null && v.longitude != null) candidates.push([Number(v.latitude), Number(v.longitude)]);
    if (v.lat != null && v.lng != null) candidates.push([Number(v.lat), Number(v.lng)]);
    if (v.location && v.location.lat != null && v.location.lng != null) candidates.push([Number(v.location.lat), Number(v.location.lng)]);
    if (v.location && v.location.latitude != null && v.location.longitude != null) candidates.push([Number(v.location.latitude), Number(v.location.longitude)]);
    if (Array.isArray(v.coordinates) && v.coordinates.length >= 2) candidates.push([Number(v.coordinates[0]), Number(v.coordinates[1])]);

    for (const c of candidates) {
      if (isValidLatLng(c[0], c[1])) return { lat: c[0], lng: c[1], simulated: false };
    }

    // If none available, generate deterministic pseudo-location near country center (India) using id or licensePlate
    const seedStr = String(v.id ?? v.licensePlate ?? Math.random());
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    // Map hash to small offsets
    const rand1 = ((h >>> 0) % 1000) / 1000 - 0.5; // -0.5..0.5
    const rand2 = (((h >>> 8) >>> 0) % 1000) / 1000 - 0.5;
    const center = [20.5937, 78.9629];
    const lat = center[0] + rand1 * 4.0; // spread ~ +/-2 degrees
    const lng = center[1] + rand2 * 6.0; // spread ~ +/-3 degrees
    return { lat, lng, simulated: true };
  };

  // Draw function: clusters, intensity and vehicle distribution
  useEffect(() => {
    let mounted = true;
    const draw = async () => {
      try {
        const data = await vehicleService.getAllVehicles();
        const vehicles = Array.isArray(data) ? data : (data.vehicles || []);
        if (!mounted || !mapRef.current) return;

        const map = mapRef.current;
        const layer = layerRef.current;
        layer.clearLayers();

        // Simple binning for clustering
        const BIN = 0.03; // degrees
        const bins = new Map();
        let maxCount = 0;

        vehicles.forEach(v => {
          const { lat, lng } = getLatLngFromVehicle(v);
          if (!isValidLatLng(lat, lng)) return;
          const latBin = Math.round(lat / BIN) * BIN;
          const lngBin = Math.round(lng / BIN) * BIN;
          const key = `${latBin.toFixed(5)}_${lngBin.toFixed(5)}`;
          const entry = bins.get(key) || {latSum:0, lngSum:0, count:0, items:[]};
          entry.latSum += lat;
          entry.lngSum += lng;
          entry.count += 1;
          entry.items.push(v);
          bins.set(key, entry);
          if (entry.count > maxCount) maxCount = entry.count;
        });

        // Intensity visualization: draw semi-transparent circles
        if (showHeat) {
          bins.forEach((value) => {
            const centerLat = value.latSum / value.count;
            const centerLng = value.lngSum / value.count;
            const count = value.count;
            const t = Math.min(count / Math.max(3, maxCount), 1);
            const color = colorFor(t);
            const radius = Math.min(15000 * Math.log(1 + count), 70000);
            const circle = L.circle([centerLat, centerLng], {
              radius,
              color,
              fillColor: color,
              fillOpacity: 0.45 * t + 0.15,
              weight: 0
            });
            circle.addTo(layer).bindPopup(`<b>Vehicles: ${count}</b><br/>Sample: ${value.items.slice(0,5).map(i=>i.licensePlate).join(', ')}`);
          });
        }

        // Cluster markers: show counts and allow zoom-to-cluster
        if (showClusters) {
          bins.forEach((value) => {
            const centerLat = value.latSum / value.count;
            const centerLng = value.lngSum / value.count;
            const count = value.count;
            const div = L.divIcon({
              html: `<div style="background:rgba(0,0,0,0.6);color:white;padding:6px 8px;border-radius:20px;font-weight:700">${count}</div>`,
              className: '',
              iconSize: [30, 30]
            });
            const marker = L.marker([centerLat, centerLng], { icon: div });
            marker.on('click', () => {
              // Zoom in to cluster
              map.setView([centerLat, centerLng], Math.min(map.getZoom() + 2, 17));
            });
            marker.addTo(layer).bindPopup(`<b>Cluster (${count})</b><br/>Vehicles: ${value.items.slice(0,10).map(i=>i.licensePlate).join(', ')}`);
          });
        }

        // Fleet distribution: small markers for each vehicle
        if (showVehicles) {
          vehicles.forEach(v => {
            const pos = getLatLngFromVehicle(v);
            const lat = pos.lat;
            const lng = pos.lng;
            if (!isValidLatLng(lat, lng)) return;
            const m = L.circleMarker([lat, lng], {
              radius: 5,
              fillColor: v.type && v.type.toLowerCase().includes('ev') ? '#10b981' : '#2563eb',
              color: '#fff',
              weight: 1,
              fillOpacity: pos.simulated ? 0.6 : 0.95
            }).bindPopup(`${v.licensePlate || 'N/A'} • ${v.type || ''}${pos.simulated ? ' (simulated)' : ''}`);
            m.addTo(layer);
          });
        }

        // Add legend control
        const maxForLegend = Math.max(1, maxCount);
        const legendHtml = `
          <div style="background:#fff;padding:8px;border-radius:6px;font-size:12px;box-shadow:0 1px 4px rgba(0,0,0,0.2)">
            <div style="font-weight:600;margin-bottom:6px">Intensity (vehicles)</div>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:120px;display:flex;justify-content:space-between">
                <span>Low</span><span>High</span>
              </div>
            </div>
            <div style="margin-top:8px;display:flex;gap:6px;align-items:center">
              ${[0,0.25,0.5,0.75,1].map(t=>`<div style="width:28px;height:12px;background:${colorFor(t)}"></div>`).join('')}
            </div>
            <div style="margin-top:6px;color:#666;font-size:11px">Max cluster: ${maxForLegend}</div>
          </div>
        `;

        // Remove previous legend if any
        const existing = document.getElementById('hf_legend');
        if (existing) existing.remove();
        const div = L.DomUtil.create('div', 'hf-legend');
        div.id = 'hf_legend';
        div.innerHTML = legendHtml;
        div.style.position = 'absolute';
        div.style.bottom = '10px';
        div.style.left = '10px';
        div.style.zIndex = 400;
        map.getContainer().appendChild(div);

      } catch (err) {
        console.error('Heatmap fetch error', err);
      }
    };

    draw();
    const id = setInterval(draw, pollInterval);
    return () => {
      mounted = false;
      clearInterval(id);
      // cleanup legend
      const existing = document.getElementById('hf_legend');
      if (existing) existing.remove();
    };
  }, [pollInterval, showHeat, showClusters, showVehicles]);

  return (
    <div className="bg-white rounded-lg shadow p-4" style={{ height: 520 }}>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Fleet Heatmap (real-time)</h3>
      <div id="admin-heatmap" style={{ height: '460px', width: '100%' }} />
    </div>
  );
};

export default Heatmap;
