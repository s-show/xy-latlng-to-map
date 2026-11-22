// jsdom does not implement SVGElement.prototype.createSVGRect, causing Leaflet's
// L.Browser.svg detection to return false and L.svg() to return null.
// Defining this before Leaflet is imported lets vector layers render in UI tests.
if (typeof SVGElement !== 'undefined' && !('createSVGRect' in SVGElement.prototype)) {
  Object.defineProperty(SVGElement.prototype, 'createSVGRect', {
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    configurable: true,
  });
}
