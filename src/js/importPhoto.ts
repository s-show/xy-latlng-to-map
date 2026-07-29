import exifr from 'exifr'
import { createMarker } from './marker.js';
import { formatNoGpsMessage } from './formatNoGpsMessage.js';
import L from "leaflet";

export function addPhotoPoint(mapDiv: L.Map, files: File[]) {
  const latlngArray: number[][] = [];
  const noGpsFiles: string[] = [];

  const promises = Array.from(files).map((file) =>
    exifr.parse(file).then(output => {
      // EXIF データが見つからない場合 `output` は `undefined` になることがある。
      // GPSデータの有無は `output?.latitude` で判定する。
      if (output?.latitude !== undefined) {
        createMarker(output.latitude, output.longitude, 'photo').addTo(mapDiv)
        latlngArray.push([output.latitude, output.longitude]);
      } else {
        noGpsFiles.push(file.name);
        console.error(file.name + 'の GPS データを読み込めませんでした');
      }
    }).catch(error => console.error('読み込みに失敗しました。' + error))
  );

  Promise.allSettled(promises).then(() => {
    if (latlngArray.length > 1) {
      const southWestPoint = L.latLng([
        latlngArray.reduce((x, y) => (x[0] < y[0]) ? x : y)[0],
        latlngArray.reduce((x, y) => (x[1] < y[1]) ? x : y)[1],
      ]);
      const northEastPoint = L.latLng([
        latlngArray.reduce((x, y) => (x[0] > y[0]) ? x : y)[0],
        latlngArray.reduce((x, y) => (x[1] > y[1]) ? x : y)[1],
      ]);
      mapDiv.fitBounds(
        L.latLngBounds(
          southWestPoint, northEastPoint
        )
      );
    } else if (latlngArray.length === 1) {
      mapDiv.panTo([latlngArray[0][0], latlngArray[0][1]])
    }

    const message = formatNoGpsMessage(noGpsFiles);
    if (message !== null) {
      alert(message);
    }
  }).catch(error => console.error('読み込みに失敗しました。' + error));
}
