import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import "./map.scss";
import "leaflet/dist/leaflet.css";
import Pin from "../pin/Pin";


function ChangeView({ items }) {
  const map = useMap();

  useEffect(() => {
    if (items.length === 1) {
      map.setView([items[0].latitude, items[0].longitude], 12);
    } else if (items.length > 1) {
      const bounds = items.map((item) => [item.latitude, item.longitude]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([1.3521, 103.8198], 7);
    }
  }, [items, map]);

  return null; 
}

function Map({ items }) {
  return (
    <MapContainer
      center={
        items.length === 1
          ? [items[0].latitude, items[0].longitude]
          : [1.3521, 103.8198]
      }
      zoom={7}
      scrollWheelZoom={false}
      className="map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <ChangeView items={items} />

      {items.map((item) => (
        <Pin item={item} key={item.id} />
      ))}
    </MapContainer>
  );
}

export default Map;