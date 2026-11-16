/// <reference types="leaflet.gridlayer.googlemutant" />

// @types/leaflet.gridlayer.googlemutant は L.gridLayer.googleMutant() のファクトリだけを宣言している。
// このアプリは vite.config.js の alias で ESM 版（src/Leaflet.GoogleMutant.mjs）を読み込み、
// その既定エクスポートのクラスを new するため、既定エクスポートの型をここで宣言する。
declare module 'leaflet.gridlayer.googlemutant' {
  const GoogleMutant: new (options?: L.gridLayer.GoogleMutantOptions) => L.gridLayer.GoogleMutant;
  export default GoogleMutant;
}
