const getImage = (fileName) => {
  return new URL(`../assets/${fileName}.png`, import.meta.url).href;
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
const gsiStandard = L.tileLayer(
  'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', 
  {
    minZoom: 5,
    maxZoom: 18,
    attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
  }
);
// 地理院地図の淡色地図タイル
const gsiPale = L.tileLayer(
  'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', 
  {
    minZoom: 5,
    maxZoom: 18,
    attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
  }
);
// 地理院地図の写真タイル
const gsiSatellite = L.tileLayer(
  'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
  {
    minZoom: 14,
    maxZoom: 18,
    attribution: "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>地理院タイル</a>"
  }
);
// 地理院地図の年代別（1974年～1978年）写真タイル
const gsiSatellite1974_1978 = L.tileLayer(
  'https://cyberjapandata.gsi.go.jp/xyz/gazo1/{z}/{x}/{y}.jpg',
  {
    minZoom: 10,
    maxZoom: 18,
    attribution: "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>地理院タイル</a>"
  }
);
// 地理院地図の年代別（1961年～1969年）写真タイル
const gsiSatellite1961_1969 = L.tileLayer(
  'https://cyberjapandata.gsi.go.jp/xyz/ort_old10/{z}/{x}/{y}.png',
  {
    minZoom: 10,
    maxZoom: 18,
    attribution: "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>地理院タイル</a>"
  }
);

const baseMaps = {
  // "Google Map (航空写真)": googlemapHybrid,
  // "Google Map (地図)": googlemapRoadmap,
  "地理院地図 (標準地図)": gsiStandard,
  "地理院地図 (淡色地図)": gsiPale,
  "地理院地図 (航空写真)": gsiSatellite,
  "地理院地図 (航空写真・1974-78年)": gsiSatellite1974_1978,
  "地理院地図 (航空写真・1961-69年)": gsiSatellite1961_1969,
}

const redArrowIcon = L.icon({
  iconUrl: getImage('redMarker'),
  iconSize:     [20, 20], // size of the icon
  iconAnchor:   [10, 20], // point of the icon which will correspond to marker's location
  popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

const blueArrowIcon = L.icon({
  iconUrl: getImage('blueMarker'),
  iconSize:     [20, 20], // size of the icon
  iconAnchor:   [10, 20], // point of the icon which will correspond to marker's location
  popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

const greenArrowIcon = L.icon({
  iconUrl: getImage('greenMarker'),
  iconSize:     [20, 20], // size of the icon
  iconAnchor:   [10, 20], // point of the icon which will correspond to marker's location
  popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

export { gsiStandard, gsiSatellite, baseMaps, redArrowIcon, blueArrowIcon, greenArrowIcon }
