import L from "leaflet";
import GoogleMutant from "leaflet.gridlayer.googlemutant";

const getImage = (fileName: string, fileType = 'png') => {
  if (fileType == 'jpg') {
    return new URL(`../assets/${fileName}.jpg`, import.meta.url).href;
  } else if (fileType == 'jpeg') {
    return new URL(`../assets/${fileName}.jpeg`, import.meta.url).href;
  } else if (fileType == 'svg') {
    return new URL(`../assets/${fileName}.svg`, import.meta.url).href;
  } else {
    return new URL(`../assets/${fileName}.png`, import.meta.url).href;
  }
};

// Google Map の道路地図
const googleMapRoadmap = new GoogleMutant({
  type: "roadmap",
  attribution: '&copy; <a href="https://www.google.com/maps" target="_blank translate="no"><span>Google Maps</span></a>',
});

// Google Map の航空写真（ラベルなし）
const googleMapSatellite = new GoogleMutant({
  type: "satellite",
  attribution: '&copy; <a href="https://www.google.com/maps" target="_blank translate="no">Google Maps</a>',
});

// Google Map の航空写真（ラベル付き）
const googleMapHybrid = new GoogleMutant({
  type: "hybrid",
  attribution: '&copy; <a href="https://www.google.com/maps" target="_blank translate="no">Google Maps</a>',
});

// Google Map の地形図
const googleMapTerrain = new GoogleMutant({
  type: "terrain",
  attribution: '&copy; <a href="https://www.google.com/maps" target="_blank translate="no">Google Maps</a>',
});

// 地理院地図の標準地図タイル
const gsiStandard = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
  minZoom: 2,
  maxZoom: 18,
  errorTileUrl: getImage('error_tile', 'png'),
  attribution:
    "<a target='_blank' href='mapSource.html'>地図の出典情報</a>",
});
// 地理院地図の淡色地図タイル
const gsiPale = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
  minZoom: 2,
  maxZoom: 18,
  errorTileUrl: getImage('error_tile', 'png'),
  attribution:
    "<a target='_blank' href='mapSource.html'>地図の出典情報</a>",
});
// 地理院地図の写真タイル
const gsiSatellite = L.tileLayer(
  'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
  {
    minZoom: 2,
    maxZoom: 18,
    errorTileUrl: getImage('error_tile', 'png'),
    attribution:
    "<a target='_blank' href='mapSource.html'>地図の出典情報</a>",
  }
);
// 地理院地図の年代別（1974年～1978年）写真タイル
const gsiSatellite1974_1978 = L.tileLayer(
  'https://cyberjapandata.gsi.go.jp/xyz/gazo1/{z}/{x}/{y}.jpg',
  {
    minZoom: 10,
    maxZoom: 18,
    errorTileUrl: getImage('error_tile', 'png'),
    attribution:
    "<a target='_blank' href='mapSource.html'>地図の出典情報</a>",
  }
);
// 地理院地図の年代別（1961年～1969年）写真タイル
const gsiSatellite1961_1969 = L.tileLayer(
  'https://cyberjapandata.gsi.go.jp/xyz/ort_old10/{z}/{x}/{y}.png',
  {
    minZoom: 10,
    maxZoom: 18,
    errorTileUrl: getImage('error_tile', 'png'),
    attribution:
    "<a target='_blank' href='mapSource.html'>地図の出典情報</a>",
  }
);

const baseMaps = {
  '地理院地図 (標準地図)': gsiStandard,
  '地理院地図 (淡色地図)': gsiPale,
  '地理院地図 (航空写真)': gsiSatellite,
  '地理院地図 (航空写真・1974-78年)': gsiSatellite1974_1978,
  '地理院地図 (航空写真・1961-69年)': gsiSatellite1961_1969,
  'Google Map (道路地図)': googleMapRoadmap,
  'Google Map (航空写真)': googleMapSatellite,
  'Google Map (航空写真・ラベル付き)': googleMapHybrid,
  'Google Map (地形図)': googleMapTerrain,
};

interface markers {
  red: L.Icon
  blue: L.Icon
  yellow: L.Icon
  green: L.Icon
  length?: L.Icon
  photo?: L.Icon
}

const markerSize = L.point(25, 25);
const markerAnchor = L.point(12.5, 12.5);
const redMarker = L.icon({
  iconUrl: getImage('circle_icon_red', 'svg'),
  iconSize: markerSize,
  iconAnchor: markerAnchor,
});
const blueMarker = L.icon({
  iconUrl: getImage('circle_icon_blue', 'svg'),
  iconSize: markerSize,
  iconAnchor: markerAnchor,
});
const yellowMarker = L.icon({
  iconUrl: getImage('circle_icon_yellow', 'svg'),
  iconSize: markerSize,
  iconAnchor: markerAnchor,
});
const greenMarker = L.icon({
  iconUrl: getImage('circle_icon_green', 'svg'),
  iconSize: markerSize,
  iconAnchor: markerAnchor,
});
const lengthMarker = L.icon({
  iconUrl: getImage('length_pin_icon', 'svg'),
  iconSize: L.point(30, 30),
  iconAnchor: L.point(15, 30),
  className: 'lengthStartIcon',
});
const photoMarker = L.icon({
  iconUrl: getImage('photo_icon', 'svg'),
  iconSize: L.point(30, 30),
  iconAnchor: L.point(15, 30),
  className: 'photoIcon',
});
const markers: markers = {
  red: redMarker,
  blue: blueMarker,
  yellow: yellowMarker,
  green: greenMarker,
  length: lengthMarker,
  photo: photoMarker
};

const centerMarkerSize = L.point(30, 30);
const centerMarkerAnchor = L.point(15, 15);
const redCenterMarker = L.icon({
  iconUrl: getImage('redCenterMarker', 'svg'),
  iconSize: centerMarkerSize,
  iconAnchor: centerMarkerAnchor,
});
const blueCenterMarker = L.icon({
  iconUrl: getImage('blueCenterMarker', 'svg'),
  iconSize: centerMarkerSize,
  iconAnchor: centerMarkerAnchor,
});
const yellowCenterMarker = L.icon({
  iconUrl: getImage('yellowCenterMarker', 'svg'),
  iconSize: centerMarkerSize,
  iconAnchor: centerMarkerAnchor,
});
const greenCenterMarker = L.icon({
  iconUrl: getImage('greenCenterMarker', 'svg'),
  iconSize: centerMarkerSize,
  iconAnchor: centerMarkerAnchor,
});

const centerMarkers: markers = {
  red: redCenterMarker,
  blue: blueCenterMarker,
  yellow: yellowCenterMarker,
  green: greenCenterMarker,
};

export { gsiStandard, baseMaps, markers, centerMarkers };
