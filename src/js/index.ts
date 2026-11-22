import L from 'leaflet';
import {
  MAP_COORDINATE_SYSTEM,
  parseCoordinateSystem,
  removeInvalidRows,
  convertRows,
  buildCsvHeader,
} from './conversion.js';
import type { Conversion } from './conversion.js';
import { createAppTables } from './jspreadsheet.js';
import type { AppTables } from './jspreadsheet.js';
import { exportCSV } from './exportCSV.js';
import { addMarkerGroups } from './marker.js';
import { DEFAULT_CIRCLE_LINE_COLOR, isIconColor, isLineColorName, LINE_COLORS } from './colors.js';
import { createMapContext } from './map.js';
import type { MapIcons } from './mapIcons.js';
import type { MeasurementState } from './measurement.js';
import { createMarkerApiController, formatApiErrors } from './markerApi.js';
import type { XyLatLngToMapApi } from './markerApi.js';
import { hasMarkerQueryParams } from './markerApiSchema.js';
import { setupAddressSearch } from './addressSearchUi.js';
import { setupPrint } from './print.js';
import { addCircle } from './circle.js';
import { addPhotoPoint } from './importPhoto.js';
import { isImageFile } from './isImageFile.js';
import { splitDataByBlankRows } from './splitTableData.js';
import 'bootstrap';
import 'leaflet/dist/leaflet.css';

export interface BootstrapOptions {
  readonly doc?: Document;
  readonly win?: Window;
  readonly search?: string;
  readonly createTables?: (doc: Document) => AppTables;
  readonly reinfolibProxyUrl?: string;
  readonly googleMapsApiKey?: string;
  readonly notify?: (message: string) => void;
}

export interface AppHandle {
  readonly map: L.Map;
  readonly measurementState: MeasurementState;
  readonly icons: MapIcons;
  readonly tables: AppTables;
  readonly markerApi: XyLatLngToMapApi;
  dispose(): void;
}

const initializedMapContainers = new WeakSet<HTMLElement>();

export function showErrorBanner(doc: Document, message: string): void {
  const wrap = doc.querySelector<HTMLDivElement>('#error-message-wrap');
  const messageEl = doc.querySelector<HTMLParagraphElement>('#error-message');
  if (messageEl !== null) {
    messageEl.textContent = message;
  }
  if (wrap !== null) {
    wrap.classList.remove('visually-hidden');
  }
}

export function hideErrorBanner(doc: Document): void {
  const wrap = doc.querySelector<HTMLDivElement>('#error-message-wrap');
  const messageEl = doc.querySelector<HTMLParagraphElement>('#error-message');
  if (messageEl !== null) {
    messageEl.textContent = '';
  }
  if (wrap !== null) {
    wrap.classList.add('visually-hidden');
  }
}

export function bootstrapApp(options: BootstrapOptions = {}): AppHandle {
  const doc = options.doc ?? document;
  const win = options.win ?? window;
  const notify = options.notify ?? ((message: string) => win.alert(message));
  const mapDiv = doc.querySelector<HTMLDivElement>('#map');

  if (mapDiv === null) {
    throw new Error('Map container #map was not found in document.');
  }
  if (initializedMapContainers.has(mapDiv)) {
    throw new Error('App is already initialized for this map container. Call dispose() first.');
  }
  initializedMapContainers.add(mapDiv);

  const controller = new AbortController();
  const { signal } = controller;

  const mapContext = createMapContext(mapDiv, {
    doc,
    reinfolibProxyUrl: options.reinfolibProxyUrl,
    googleMapsApiKey: options.googleMapsApiKey,
    notify,
  });
  const { map, measurementState, icons } = mapContext;
  const tables = (options.createTables ?? createAppTables)(doc);
  const { sourceTable, convertedTable } = tables;
  const markerApiController = createMarkerApiController({
    map,
    measurementState,
    icons: icons.markers,
  });
  win.xyLatLngToMap = markerApiController.publicApi;

  const getMenuColumnWidth = (): number => {
    const menuColumn = doc.querySelector('#menu-column');
    if (menuColumn instanceof HTMLElement) {
      return Math.max(menuColumn.offsetWidth, win.innerWidth || 0);
    }
    return win.innerWidth || 0;
  };

  win.addEventListener(
    'resize',
    () => {
      tables.resizeTable(getMenuColumnWidth());
    },
    { signal },
  );

  const setupDialog = () => {
    const geodeticSystemSelectBtn = doc.querySelectorAll<HTMLButtonElement>('[data-geodetic-system]');
    const geodeticSystemRadioBtn = doc.querySelectorAll<HTMLInputElement>('input[name="source-geodetic-system"]');
    if (geodeticSystemRadioBtn.length > 0) {
      geodeticSystemSelectBtn.forEach((btn) => {
        btn.addEventListener(
          'click',
          () => {
            geodeticSystemRadioBtn.forEach((radioBtn) => {
              if (btn.getAttribute('data-geodetic-system') === radioBtn.value) {
                radioBtn.checked = true;
              }
            });
            doc.querySelector<HTMLDialogElement>('#geodetic-system-dialog')?.close();
          },
          { signal },
        );
      });
    }
    const zoneNoSelectBtn = doc.querySelectorAll<HTMLButtonElement>('[data-zone-no-btn]');
    const sourceZoneNo = doc.querySelector<HTMLSelectElement>('#source-zone-no');
    if (sourceZoneNo !== null) {
      zoneNoSelectBtn.forEach((btn) => {
        btn.addEventListener(
          'click',
          (e) => {
            if (e.currentTarget instanceof HTMLButtonElement) {
              sourceZoneNo.value = String(e.currentTarget.getAttribute('data-zone-no-btn'));
              if (sourceZoneNo.options[0]) {
                sourceZoneNo.options[0].disabled = true;
              }
              doc.querySelector<HTMLDialogElement>('#zone-no-dialog')?.close();
            }
          },
          { signal },
        );
      });
    }
  };

  if (doc.readyState === 'complete') {
    setupDialog();
  } else {
    win.addEventListener('load', setupDialog, { signal, once: true });
  }

  const changeZoneNo = (selectedBtn: HTMLInputElement, selectMenu: HTMLSelectElement) => {
    selectedBtn.addEventListener(
      'input',
      () => {
        if (selectedBtn.value === 'latlng') {
          selectMenu.options[0].selected = true;
          selectMenu.disabled = true;
        } else {
          selectMenu.disabled = false;
          selectMenu.options[1].selected = true;
          selectMenu.options[0].disabled = true;
        }
      },
      { signal },
    );
  };

  doc.querySelectorAll<HTMLInputElement>('[name="source-data-type"]').forEach((selectedBtn) => {
    const sourceZoneNo = doc.querySelector<HTMLSelectElement>('#source-zone-no');
    if (sourceZoneNo !== null) {
      changeZoneNo(selectedBtn, sourceZoneNo);
    }
  });
  doc.querySelectorAll<HTMLInputElement>('[name="convert-to-data-type"]').forEach((selectedBtn) => {
    const convertZoneNo = doc.querySelector<HTMLSelectElement>('#convert-zone-no');
    if (convertZoneNo !== null) {
      changeZoneNo(selectedBtn, convertZoneNo);
    }
  });

  const checkedRadioValue = (name: string): string | null =>
    doc.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? null;

  const readConversionForm = (): Conversion | null => {
    const source = parseCoordinateSystem({
      type: checkedRadioValue('source-data-type'),
      geodeticSystem: checkedRadioValue('source-geodetic-system'),
      zoneNo: doc.querySelector<HTMLSelectElement>('#source-zone-no')?.value,
    });
    const target = parseCoordinateSystem({
      type: checkedRadioValue('convert-to-data-type'),
      geodeticSystem: checkedRadioValue('convert-to-geodetic-system'),
      zoneNo: doc.querySelector<HTMLSelectElement>('#convert-zone-no')?.value,
    });
    return source !== null && target !== null ? { source, target } : null;
  };

  // 第4引数の true は、セルの入力値ではなく表示用に加工された値を取得する指定
  const readSourceRows = () => sourceTable[0].getData(undefined, undefined, undefined, true);

  const selectedLineColor = (): string | null => {
    const value = doc.querySelector<HTMLSelectElement>('#select-line-color')?.value;
    return isLineColorName(value) ? (LINE_COLORS.get(value) ?? null) : null;
  };

  const zoneNoDialog = doc.querySelector<HTMLDialogElement>('#zone-no-dialog');
  if (zoneNoDialog !== null) {
    zoneNoDialog.addEventListener(
      'command',
      (event) => {
        if (typeof CommandEvent !== 'undefined' && event instanceof CommandEvent && event.command === 'show-modal') {
          const zoneNoSelectBtns = doc.querySelectorAll<HTMLButtonElement>('[data-zone-no-btn]');
          const dataType = checkedRadioValue('source-data-type');
          zoneNoSelectBtns.forEach((btn) => {
            if (btn.parentElement !== null) {
              if (dataType === 'XY') {
                btn.parentElement.classList.remove('d-none');
                btn.classList.remove('d-none');
              } else {
                btn.parentElement.classList.add('d-none');
                btn.classList.add('d-none');
              }
            }
          });
        }
      },
      { signal },
    );
  }

  const dataConvertBtn = doc.querySelector<HTMLButtonElement>('#data-convert-btn');
  if (dataConvertBtn !== null) {
    dataConvertBtn.addEventListener(
      'click',
      (e) => {
        const conversion = readConversionForm();
        if (conversion !== null) {
          convertedTable[0].setData(convertRows(conversion, removeInvalidRows(readSourceRows())));
          e.preventDefault();
        }
      },
      { signal },
    );
  }

  const clearSourceTableBtn = doc.querySelector<HTMLButtonElement>('#clear-source-table-btn');
  if (clearSourceTableBtn !== null) {
    clearSourceTableBtn.addEventListener(
      'click',
      (e) => {
        tables.clearTable('source');
        e.preventDefault();
      },
      { signal },
    );
  }

  const clearConvertedTableBtn = doc.querySelector<HTMLButtonElement>('#clear-converted-table-btn');
  if (clearConvertedTableBtn !== null) {
    clearConvertedTableBtn.addEventListener(
      'click',
      (e) => {
        tables.clearTable('converted');
        e.preventDefault();
      },
      { signal },
    );
  }

  const addMarkerBtn = doc.querySelector<HTMLButtonElement>('#add-marker-btn');
  if (addMarkerBtn !== null) {
    addMarkerBtn.addEventListener(
      'click',
      (e) => {
        const dataGroups = splitDataByBlankRows(readSourceRows())
          .map((group) => removeInvalidRows(group))
          .filter((group) => group.length > 0);
        if (dataGroups.length > 0) {
          const conversion = readConversionForm();
          if (conversion !== null) {
            const toMap = { source: conversion.source, target: MAP_COORDINATE_SYSTEM };
            const iconColor = doc.querySelector<HTMLSelectElement>('#select-marker-icon')?.value ?? 'none';
            addMarkerGroups(
              map,
              dataGroups.map((group) => convertRows(toMap, group)),
              { iconColor: isIconColor(iconColor) ? iconColor : null, lineColor: selectedLineColor() },
              { measurementState, icons: icons.markers },
            );
          }
          e.preventDefault();
        }
      },
      { signal },
    );
  }

  const removeMarkerBtn = doc.querySelector<HTMLButtonElement>('#remove-marker-btn');
  if (removeMarkerBtn !== null) {
    removeMarkerBtn.addEventListener(
      'click',
      (e) => {
        markerApiController.clearMarkers();
        map.eachLayer((layer) => {
          // `layer._url` が定義されているのは地図タイルのみ。
          if (!('_url' in layer)) {
            layer.remove();
          }
        });
        e.preventDefault();
      },
      { signal },
    );
  }

  const disposePrint = setupPrint({ map, sourceTable: sourceTable[0], doc, win });

  const zoomRangeInput = doc.querySelector<HTMLInputElement>('#zoom-range');
  const zoomRangeValue = doc.querySelector<HTMLOutputElement>('#zoom-range-value');
  if (zoomRangeInput !== null && zoomRangeValue !== null) {
    zoomRangeInput.addEventListener(
      'input',
      (e) => {
        if (e.currentTarget instanceof HTMLInputElement) {
          mapDiv.style.transform = `scale(${e.currentTarget.value})`;
          zoomRangeValue.value = `${e.currentTarget.value}x`;
        }
      },
      { signal },
    );
  }

  const menuColumn = doc.querySelector('#menu-column');
  if (menuColumn !== null) {
    menuColumn.addEventListener(
      'command',
      (event) => {
        if (
          typeof CommandEvent !== 'undefined' &&
          event instanceof CommandEvent &&
          (event.command === 'show-popover' || event.command === 'hide-popover')
        ) {
          map.invalidateSize();
          tables.resizeTable(getMenuColumnWidth());
        }
      },
      { signal },
    );
  }

  mapDiv.addEventListener(
    'dragover',
    (event) => {
      event.preventDefault();
    },
    { signal },
  );
  mapDiv.addEventListener(
    'drop',
    (event) => {
      event.preventDefault();
      if (event.dataTransfer !== null) {
        const files = Array.from(event.dataTransfer.files);
        const imageFiles = files.filter(isImageFile);
        const rejectedCount = files.length - imageFiles.length;
        if (rejectedCount > 0) {
          notify(`画像ファイル以外は読み込めません。${rejectedCount}件のファイルを除外しました。`);
        }
        if (imageFiles.length > 0) {
          void addPhotoPoint(map, imageFiles, { measurementState, icons: icons.markers, notify });
        }
      }
    },
    { signal },
  );

  const addCircleToMap = doc.querySelector<HTMLButtonElement>('#add-circle-to-map');
  const inputDiameter = doc.querySelector<HTMLDialogElement>('#input-diameter');
  const latitude = doc.querySelector<HTMLInputElement>('#latitude');
  const longitude = doc.querySelector<HTMLInputElement>('#longitude');
  const selectLineColorSelector = doc.querySelector<HTMLSelectElement>('#select-line-color');
  const circleRadius = doc.querySelector<HTMLInputElement>('#radius');
  const cancelAddCircle = doc.querySelector<HTMLButtonElement>('#cancel-add-circle');
  if (
    addCircleToMap !== null &&
    inputDiameter !== null &&
    latitude !== null &&
    longitude !== null &&
    selectLineColorSelector !== null &&
    circleRadius !== null &&
    cancelAddCircle !== null
  ) {
    addCircleToMap.addEventListener(
      'click',
      (e) => {
        const latlng = L.latLng(Number(latitude.value), Number(longitude.value));
        const lineColor = selectedLineColor() ?? DEFAULT_CIRCLE_LINE_COLOR;
        let markerColor = selectLineColorSelector.value;
        if (markerColor === 'no') {
          markerColor = 'red';
        }
        let radius = 0;
        if (Number(circleRadius.value) >= 0) {
          radius = Number(circleRadius.value);
        }
        const circle = addCircle(latlng, radius, lineColor, markerColor, {
          map,
          measurementState,
          icons: icons.centerMarkers,
        });
        circle.circle.addTo(map);
        circle.marker.addTo(map);
        circle.tooltip.addTo(map);
        circleRadius.value = '0';
        inputDiameter.close();
        e.preventDefault();
      },
      { signal },
    );
    cancelAddCircle.addEventListener(
      'click',
      (e) => {
        inputDiameter.close();
        e.preventDefault();
      },
      { signal },
    );
    inputDiameter.addEventListener(
      'close',
      (e) => {
        circleRadius.value = '0';
        e.preventDefault();
      },
      { signal },
    );
  }

  const disposeAddressSearch = setupAddressSearch(map, { doc });

  const exportCSVBtn = doc.querySelector<HTMLButtonElement>('#export-csv-btn');
  const dataConvertDiv = doc.querySelector<HTMLDivElement>('#data-convert-pane');
  if (exportCSVBtn !== null) {
    exportCSVBtn.addEventListener(
      'click',
      () => {
        const conversion = readConversionForm();
        const headerText = conversion !== null ? buildCsvHeader(conversion) : [['', '', '', '']];
        const sourceData = sourceTable[0].getData();
        const convertData = convertedTable[0].getData();
        sourceData.forEach((data, index) => {
          if (data[0] != '') {
            data.push(...convertData[index]);
          }
        });
        sourceData.unshift(...headerText);
        const csvData = exportCSV(sourceData);
        if (csvData instanceof Blob && dataConvertDiv !== null) {
          const objUrl = URL.createObjectURL(csvData);
          const link = doc.createElement('a');
          link.setAttribute('href', objUrl);
          link.setAttribute('download', 'data.csv');
          link.textContent = 'Click to Download';

          dataConvertDiv.appendChild(link);
          link.click();
          dataConvertDiv.removeChild(link);
          URL.revokeObjectURL(objUrl);
        }
      },
      { signal },
    );
  }

  const initialSearch = options.search !== undefined ? options.search : (win.location?.search ?? '');
  if (hasMarkerQueryParams(initialSearch)) {
    const hydrationResult = markerApiController.applyQueryParams(initialSearch);
    if (!hydrationResult.ok) {
      showErrorBanner(doc, formatApiErrors(hydrationResult.errors));
    } else {
      hideErrorBanner(doc);
    }
  }

  const previousOnError = win.onerror;
  win.onerror = function myErrorHandler(errorMsg) {
    showErrorBanner(doc, String(errorMsg));
    return false;
  };

  let disposed = false;
  return {
    map,
    measurementState,
    icons,
    tables,
    markerApi: markerApiController.publicApi,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      controller.abort();
      markerApiController.clearMarkers();
      if (win.xyLatLngToMap === markerApiController.publicApi) {
        delete win.xyLatLngToMap;
      }
      disposeAddressSearch();
      disposePrint();
      tables.dispose();
      mapContext.dispose();
      win.onerror = previousOnError;
      initializedMapContainers.delete(mapDiv);
    },
  };
}

if (typeof document !== 'undefined' && document.getElementById('map') !== null) {
  bootstrapApp();
}
