import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom ISS Icon
const issIcon = new L.Icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
  iconSize: [50, 30],
  iconAnchor: [25, 15],
  popupAnchor: [0, -15],
  className: 'drop-shadow-lg'
});

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const ISSMap = ({ issData, history }) => {
  const defaultCenter = [0, 0];
  const center = issData ? [issData.lat, issData.lon] : defaultCenter;

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={center} zoom={3} className="w-full h-full rounded-xl">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {issData && (
          <Marker position={center} icon={issIcon}>
            <Popup>
              <div className="text-center">
                <strong>ISS Current Position</strong><br/>
                Lat: {issData.lat.toFixed(4)}<br/>
                Lon: {issData.lon.toFixed(4)}<br/>
                Speed: {issData.speed} km/h
              </div>
            </Popup>
          </Marker>
        )}
        {history.length > 1 && (
          <Polyline positions={history} color="red" weight={3} opacity={0.7} />
        )}
        <MapUpdater center={center} />
      </MapContainer>
    </div>
  );
};

export default ISSMap;
