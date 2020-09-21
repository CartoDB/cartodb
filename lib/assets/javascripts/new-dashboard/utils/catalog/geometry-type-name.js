const geometryTypes = {
  LINESTRING: 'Line',
  MULTILINESTRING: 'Multiline',
  MULTIPLE: 'Multiple',
  POLYGON: 'Polygon',
  POINT: 'Point',
  MULTIPOLYGON: 'Multipolygon'
};

export function geometryTypeName (geometry) {
  return geometry ? geometryTypes[geometry] : 'Other';
}
