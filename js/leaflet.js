const getImage = (fileName, fileType = 'png') => {
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

// Google map の航空写真
// const googlemapHybrid = L.gridLayer.googleMutant({
// 	type: "hybrid", // valid values are 'roadmap', 'satellite', 'terrain' and 'hybrid'
// });
// // Google map の通常地図
// const googlemapRoadmap = L.gridLayer.googleMutant({
// 	type: "roadmap", // valid values are 'roadmap', 'satellite', 'terrain' and 'hybrid'
// });
// 地理院地図の標準地図タイル
const gsiStandard = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
  minZoom: 5,
  maxZoom: 18,
  attribution:
    "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>",
});
// 地理院地図の淡色地図タイル
const gsiPale = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
  minZoom: 5,
  maxZoom: 18,
  attribution:
    "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>",
});
// 地理院地図の写真タイル
const gsiSatellite = L.tileLayer(
  'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
  {
    minZoom: 14,
    maxZoom: 18,
    attribution:
      "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>地理院タイル</a>",
  }
);
// 地理院地図の年代別（1974年～1978年）写真タイル
const gsiSatellite1974_1978 = L.tileLayer(
  'https://cyberjapandata.gsi.go.jp/xyz/gazo1/{z}/{x}/{y}.jpg',
  {
    minZoom: 10,
    maxZoom: 18,
    attribution:
      "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>地理院タイル</a>",
  }
);
// 地理院地図の年代別（1961年～1969年）写真タイル
const gsiSatellite1961_1969 = L.tileLayer(
  'https://cyberjapandata.gsi.go.jp/xyz/ort_old10/{z}/{x}/{y}.png',
  {
    minZoom: 10,
    maxZoom: 18,
    attribution:
      "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>地理院タイル</a>",
  }
);

const baseMaps = {
  // "Google Map (航空写真)": googlemapHybrid,
  // "Google Map (地図)": googlemapRoadmap,
  '地理院地図 (標準地図)': gsiStandard,
  '地理院地図 (淡色地図)': gsiPale,
  '地理院地図 (航空写真)': gsiSatellite,
  '地理院地図 (航空写真・1974-78年)': gsiSatellite1974_1978,
  '地理院地図 (航空写真・1961-69年)': gsiSatellite1961_1969,
};

const markerSize = [30, 30];
const markerAnchor = [15, 30];
const redMarker = L.icon({
  iconUrl: getImage('redPinMarker', 'svg'),
  iconSize: markerSize,
  iconAnchor: markerAnchor,
});
const blueMarker = L.icon({
  iconUrl: getImage('bluePinMarker', 'svg'),
  iconSize: markerSize,
  iconAnchor: markerAnchor,
});
const yellowMarker = L.icon({
  iconUrl: getImage('yellowPinMarker', 'svg'),
  iconSize: markerSize,
  iconAnchor: markerAnchor,
});
const greenMarker = L.icon({
  iconUrl: getImage('greenPinMarker', 'svg'),
  iconSize: markerSize,
  iconAnchor: markerAnchor,
});
const lengthMarker = L.icon({
  iconUrl: getImage('lengthIcon', 'svg'),
  iconSize: markerSize,
  iconAnchor: markerAnchor,
  className: 'lengthStartIcon',
});
const markers = {
  red: redMarker,
  blue: blueMarker,
  yellow: yellowMarker,
  green: greenMarker,
  length: lengthMarker,
};

const centerMarkerSize = [30, 30]; // size of the icon
const centerMarkerAnchor = [15, 15]; // point of the icon which will correspond to marker's location
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
const centerMarkers = {
  red: redCenterMarker,
  blue: blueCenterMarker,
  yellow: yellowCenterMarker,
  green: greenCenterMarker,
};

const lengthIconSize = [30, 30]; // size of the icon
const lengthIconAnchor = [15, 30]; // point of the icon which will correspond to marker's location
const lengthStartIcon = L.icon({
  iconUrl: getImage('lengthIcon', 'svg'),
  iconSize: centerMarkerSize,
  iconAnchor: lengthIconAnchor,
  className: 'lengthStartIcon',
});
const lengthIcons = {
  start: lengthStartIcon,
};

export { gsiStandard, baseMaps, markers, centerMarkers, lengthIcons };
