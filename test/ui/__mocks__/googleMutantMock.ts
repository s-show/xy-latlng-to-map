import L from 'leaflet';

export default class GoogleMutantMock extends L.GridLayer {
  constructor(options?: L.GridLayerOptions & { type?: string }) {
    super(options);
  }
}
