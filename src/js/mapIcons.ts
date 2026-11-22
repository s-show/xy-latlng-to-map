import L from 'leaflet';

export interface MarkerIconSet {
  red: L.Icon;
  blue: L.Icon;
  yellow: L.Icon;
  green: L.Icon;
  length: L.Icon;
  photo: L.Icon;
}

export interface CenterMarkerIconSet {
  red: L.Icon;
  blue: L.Icon;
  yellow: L.Icon;
  green: L.Icon;
}

export interface MapIcons {
  markers: MarkerIconSet;
  centerMarkers: CenterMarkerIconSet;
}

export type AssetUrlResolver = (fileName: string, fileType: string) => string;

export function defaultAssetUrlResolver(fileName: string, fileType = 'png'): string {
  if (fileType === 'jpg') {
    return new URL(`../assets/${fileName}.jpg`, import.meta.url).href;
  }
  if (fileType === 'jpeg') {
    return new URL(`../assets/${fileName}.jpeg`, import.meta.url).href;
  }
  if (fileType === 'svg') {
    return new URL(`../assets/${fileName}.svg`, import.meta.url).href;
  }
  return new URL(`../assets/${fileName}.png`, import.meta.url).href;
}

export function createMarkerIcons(resolveAssetUrl: AssetUrlResolver = defaultAssetUrlResolver): MapIcons {
  const markerSize = L.point(25, 25);
  const markerAnchor = L.point(12.5, 12.5);
  const markers: MarkerIconSet = {
    red: L.icon({
      iconUrl: resolveAssetUrl('circle_icon_red', 'svg'),
      iconSize: markerSize,
      iconAnchor: markerAnchor,
    }),
    blue: L.icon({
      iconUrl: resolveAssetUrl('circle_icon_blue', 'svg'),
      iconSize: markerSize,
      iconAnchor: markerAnchor,
    }),
    yellow: L.icon({
      iconUrl: resolveAssetUrl('circle_icon_yellow', 'svg'),
      iconSize: markerSize,
      iconAnchor: markerAnchor,
    }),
    green: L.icon({
      iconUrl: resolveAssetUrl('circle_icon_green', 'svg'),
      iconSize: markerSize,
      iconAnchor: markerAnchor,
    }),
    length: L.icon({
      iconUrl: resolveAssetUrl('length_pin_icon', 'svg'),
      iconSize: L.point(30, 30),
      iconAnchor: L.point(15, 30),
      className: 'length-start-icon',
    }),
    photo: L.icon({
      iconUrl: resolveAssetUrl('photo_icon', 'svg'),
      iconSize: L.point(30, 30),
      iconAnchor: L.point(15, 30),
      className: 'photo-icon',
    }),
  };

  const centerMarkerSize = L.point(30, 30);
  const centerMarkerAnchor = L.point(15, 15);
  const centerMarkers: CenterMarkerIconSet = {
    red: L.icon({
      iconUrl: resolveAssetUrl('redCenterMarker', 'svg'),
      iconSize: centerMarkerSize,
      iconAnchor: centerMarkerAnchor,
    }),
    blue: L.icon({
      iconUrl: resolveAssetUrl('blueCenterMarker', 'svg'),
      iconSize: centerMarkerSize,
      iconAnchor: centerMarkerAnchor,
    }),
    yellow: L.icon({
      iconUrl: resolveAssetUrl('yellowCenterMarker', 'svg'),
      iconSize: centerMarkerSize,
      iconAnchor: centerMarkerAnchor,
    }),
    green: L.icon({
      iconUrl: resolveAssetUrl('greenCenterMarker', 'svg'),
      iconSize: centerMarkerSize,
      iconAnchor: centerMarkerAnchor,
    }),
  };

  return { markers, centerMarkers };
}

const defaultIcons = createMarkerIcons();
export const { markers, centerMarkers } = defaultIcons;
