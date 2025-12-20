import exifr from 'exifr'
import { createMarker } from './marker.js';
import L from "leaflet";

export function addPhotoPoint(mapDiv: L.Map, files: FileList) {
  const latlngArray: number[][] = [];
  Array.from(files).forEach((file) => {
    exifr.parse(file).then(output => {
      // GPSデータが無くても `output` は `null` や `undefined` にならないが
      // `output.latitude` は `undefined` になるので、それを分岐条件にしている。
      if (output.latitude !== undefined) {
        createMarker(output.latitude, output.longitude, 'photo').addTo(mapDiv)
        latlngArray.push([output.latitude, output.longitude]);
      } else {
        console.error(file.name + 'の GPS データを読み込めませんでした')
      }
    }).then(() => {
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
    }).catch(error => console.error('読み込みに失敗しました。' + error))
  })
}
