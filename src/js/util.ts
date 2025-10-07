export function hasLatLng(layer: L.Layer): layer is L.Circle |
  L.Marker | L.CircleMarker {
  return 'getLatLng' in layer && typeof layer.getLatLng ===
    'function';
}

export function hasLatLngs(layer: L.Layer): layer is L.Polyline {
  return 'getLatLngs' in layer && typeof layer.getLatLngs ===
    'function';
}

