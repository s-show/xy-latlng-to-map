import type { XyLatLngToMapApi } from './markerApi.js';

declare global {
  interface Window {
    xyLatLngToMap?: XyLatLngToMapApi;
  }
}

export {};
