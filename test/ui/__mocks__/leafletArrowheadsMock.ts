import L from 'leaflet';

const proto = L.Polyline.prototype as L.Polyline & {
  arrowheads?: (options?: Record<string, unknown>) => L.Polyline;
};

if (typeof proto.arrowheads !== 'function') {
  proto.arrowheads = function arrowheads() {
    return this;
  };
}

export {};
