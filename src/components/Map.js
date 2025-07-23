import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const courierIcon = new L.Icon({
  iconUrl: 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=K|0000ff|ffffff',
  iconSize: [30, 45],
  iconAnchor: [15, 42],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
});

// 🔢 Haversine fonksiyonu JSX dışında tanımlanmalı
function haversineDistance(coord1, coord2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}



function MyMap() {
  const courierPosition = [41.2855, 36.3333];
  const [deliveryPoints, setDeliveryPoints] = useState([
    { id: 1, name: "Adres 1", position: [41.2867, 36.3309] },
  ]);
  const [newAddress, setNewAddress] = useState("");

  const routePositions = [courierPosition, ...deliveryPoints.map(p => p.position)];

  const handleAddAddress = async () => {
    if (!newAddress.trim()) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newAddress)}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPoint = {
          id: Date.now(),
          name: newAddress,
          position: [parseFloat(lat), parseFloat(lon)],
        };

        // 🔄 Mesafeye göre sırala ve state'e ekle
        setDeliveryPoints(prev => {
          const sortedPoints = [...prev, newPoint].sort((a, b) => {
            const distA = haversineDistance(courierPosition, a.position);
            const distB = haversineDistance(courierPosition, b.position);
            return distA - distB;
          });
          return sortedPoints;
        });

        setNewAddress("");
      } else {
        alert("Adres bulunamadı.");
      }
    } catch (err) {
      alert("Adres alınırken hata oluştu.");
      console.error(err);
    }
  };

  return (
    <div>
      <h3>📍 Teslimat Noktası Ekle</h3>
      <input
        type="text"
        placeholder="Adres girin (örnek: Atakum Samsun)"
        value={newAddress}
        onChange={(e) => setNewAddress(e.target.value)}
      />
      <button onClick={handleAddAddress}>Ekle</button>

      <div style={{ height: '500px', width: '100%', marginTop: 10 }}>
        <MapContainer center={courierPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
  <TileLayer
    attribution='&copy; OpenStreetMap'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />

  <Marker position={courierPosition} icon={courierIcon}>
    <Popup>🚴 Kurye Konumu</Popup>
  </Marker>

  {deliveryPoints.map((point, index) => (
    <Marker key={point.id} position={point.position}>
      <Popup>#{index + 1} - {point.name}</Popup>
    </Marker>
  ))}

  {/* 🔴 Rota çizgisi */}
  <Polyline
    positions={[courierPosition, ...deliveryPoints.map(p => p.position)]}
    color="red"
    weight={4}
    dashArray="4"
  />
</MapContainer>

      </div>
    </div>
  );
}

export default MyMap;
