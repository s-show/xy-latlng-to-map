import proj4 from 'proj4';

// 各測地系の定義等は次のサイトを参考にして設定した
// [GISのための測地成果、測地系、楕円体、投影座標系、EPSGコードのまとめ - 自然環境保全のための周辺技術](https://tmizu23.hatenablog.com/entry/20091215/1260868350)
// [EPSG.io: Coordinate Systems Worldwide](https://epsg.io/)
const proj4Defs = [
  // TOKYO - 緯度経度
  [
    'EPSG:4301',
    '+proj=longlat +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +no_defs +type=crs',
  ],
  // JGD2000 - 緯度経度
  ['EPSG:4612', '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs'],
  // JGD2011 - 緯度経度
  ['EPSG:6668', '+proj=longlat +ellps=GRS80 +no_defs +type=crs'],
  // TOKYO - 平面直角座標
  [
    'EPSG:30161',
    '+proj=tmerc +lat_0=33 +lon_0=129.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30162',
    '+proj=tmerc +lat_0=33 +lon_0=131 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30163',
    '+proj=tmerc +lat_0=36 +lon_0=132.166666666667 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30164',
    '+proj=tmerc +lat_0=33 +lon_0=133.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30165',
    '+proj=tmerc +lat_0=36 +lon_0=134.333333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30166',
    '+proj=tmerc +lat_0=36 +lon_0=136 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30167',
    '+proj=tmerc +lat_0=36 +lon_0=137.166666666667 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30168',
    '+proj=tmerc +lat_0=36 +lon_0=138.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30169',
    '+proj=tmerc +lat_0=36 +lon_0=139.833333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30170',
    '+proj=tmerc +lat_0=40 +lon_0=140.833333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30171',
    '+proj=tmerc +lat_0=44 +lon_0=140.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30172',
    '+proj=tmerc +lat_0=44 +lon_0=142.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30173',
    '+proj=tmerc +lat_0=44 +lon_0=144.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30174',
    '+proj=tmerc +lat_0=26 +lon_0=142 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30175',
    '+proj=tmerc +lat_0=26 +lon_0=127.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30176',
    '+proj=tmerc +lat_0=26 +lon_0=124 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30177',
    '+proj=tmerc +lat_0=26 +lon_0=131 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30178',
    '+proj=tmerc +lat_0=20 +lon_0=136 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:30179',
    '+proj=tmerc +lat_0=26 +lon_0=154 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  // JGD2000 - 平面直角座標
  [
    'EPSG:2443',
    '+proj=tmerc +lat_0=33 +lon_0=129.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2444',
    '+proj=tmerc +lat_0=33 +lon_0=131 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2445',
    '+proj=tmerc +lat_0=36 +lon_0=132.1666666666667 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2446',
    '+proj=tmerc +lat_0=33 +lon_0=133.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2447',
    '+proj=tmerc +lat_0=36 +lon_0=134.3333333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2448',
    '+proj=tmerc +lat_0=36 +lon_0=136 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2449',
    '+proj=tmerc +lat_0=36 +lon_0=137.1666666666667 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2450',
    '+proj=tmerc +lat_0=36 +lon_0=138.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2451',
    '+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2452',
    '+proj=tmerc +lat_0=40 +lon_0=140.8333333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2453',
    '+proj=tmerc +lat_0=44 +lon_0=140.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2454',
    '+proj=tmerc +lat_0=44 +lon_0=142.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2455',
    '+proj=tmerc +lat_0=44 +lon_0=144.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2456',
    '+proj=tmerc +lat_0=26 +lon_0=142 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2457',
    '+proj=tmerc +lat_0=26 +lon_0=127.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2458',
    '+proj=tmerc +lat_0=26 +lon_0=124 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2459',
    '+proj=tmerc +lat_0=26 +lon_0=131 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2460',
    '+proj=tmerc +lat_0=20 +lon_0=136 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    'EPSG:2461',
    '+proj=tmerc +lat_0=26 +lon_0=154 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  // JGD2011 - 平面直角座標
  [
    'EPSG:6669',
    '+proj=tmerc +lat_0=33 +lon_0=129.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6670',
    '+proj=tmerc +lat_0=33 +lon_0=131 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6671',
    '+proj=tmerc +lat_0=36 +lon_0=132.166666666667 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6672',
    '+proj=tmerc +lat_0=33 +lon_0=133.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6673',
    '+proj=tmerc +lat_0=36 +lon_0=134.333333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6674',
    '+proj=tmerc +lat_0=36 +lon_0=136 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6675',
    '+proj=tmerc +lat_0=36 +lon_0=137.166666666667 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6676',
    '+proj=tmerc +lat_0=36 +lon_0=138.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6677',
    '+proj=tmerc +lat_0=36 +lon_0=139.833333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6678',
    '+proj=tmerc +lat_0=40 +lon_0=140.833333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6679',
    '+proj=tmerc +lat_0=44 +lon_0=140.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6680',
    '+proj=tmerc +lat_0=44 +lon_0=142.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6681',
    '+proj=tmerc +lat_0=44 +lon_0=144.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6682',
    '+proj=tmerc +lat_0=26 +lon_0=142 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6683',
    '+proj=tmerc +lat_0=26 +lon_0=127.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6684',
    '+proj=tmerc +lat_0=26 +lon_0=124 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6685',
    '+proj=tmerc +lat_0=26 +lon_0=131 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6686',
    '+proj=tmerc +lat_0=20 +lon_0=136 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  [
    'EPSG:6687',
    '+proj=tmerc +lat_0=26 +lon_0=154 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
];

const geodeticSystems = {
  // 日本測地系
  TOKYO: [
    // JGD2000 - 緯度経度
    'EPSG:4301',
    // JGD2000 - 平面直角座標
    'EPSG:30161',
    'EPSG:30162',
    'EPSG:30163',
    'EPSG:30164',
    'EPSG:30165',
    'EPSG:30166',
    'EPSG:30167',
    'EPSG:30168',
    'EPSG:30169',
    'EPSG:30170',
    'EPSG:30171',
    'EPSG:30172',
    'EPSG:30173',
    'EPSG:30174',
    'EPSG:30175',
    'EPSG:30176',
    'EPSG:30177',
    'EPSG:30178',
    'EPSG:30179',
  ],
  // 世界測地系2000
  JGD2000: [
    // JGD2000 - 緯度経度
    'EPSG:4612',
    // JGD2000 - 平面直角座標
    'EPSG:2443',
    'EPSG:2444',
    'EPSG:2445',
    'EPSG:2446',
    'EPSG:2447',
    'EPSG:2448',
    'EPSG:2449',
    'EPSG:2450',
    'EPSG:2451',
    'EPSG:2452',
    'EPSG:2453',
    'EPSG:2454',
    'EPSG:2455',
    'EPSG:2456',
    'EPSG:2457',
    'EPSG:2458',
    'EPSG:2459',
    'EPSG:2460',
    'EPSG:2461',
  ],
  // 世界測地系2011
  JGD2011: [
    // JGD2000 - 緯度経度
    'EPSG:6668',
    // JGD2000 - 平面直角座標
    'EPSG:6669',
    'EPSG:6670',
    'EPSG:6671',
    'EPSG:6672',
    'EPSG:6673',
    'EPSG:6674',
    'EPSG:6675',
    'EPSG:6676',
    'EPSG:6677',
    'EPSG:6678',
    'EPSG:6679',
    'EPSG:6680',
    'EPSG:6681',
    'EPSG:6682',
    'EPSG:6683',
    'EPSG:6684',
    'EPSG:6685',
    'EPSG:6686',
    'EPSG:6687',
  ],
};

proj4.defs(proj4Defs);

export { proj4Defs, geodeticSystems };
