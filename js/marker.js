import L from "leaflet";
import { markers } from './leaflet.js';
import 'leaflet-contextmenu';

export function createMarker(lat, lng, color, menuItems) {
  const marker = L.marker(
    [lat, lng],
    {
      icon: markers[color],
      contextmenu: true,
      contextmenuInheritItems: false,
      contextmenuItems: menuItems
    }
  )
  return marker;
}