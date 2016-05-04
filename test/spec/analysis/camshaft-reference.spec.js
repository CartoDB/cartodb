var camshaftReference = require('../../../src/analysis/camshaft-reference');

describe('src/analysis/camshaft-reference', function () {
  describe('.getSourceNamesForAnalysisType', function () {
    it('should return the source names for a given analyses type', function () {
      expect(camshaftReference.getSourceNamesForAnalysisType('source')).toEqual([]);
      expect(camshaftReference.getSourceNamesForAnalysisType('point-in-polygon')).toEqual(['points_source', 'polygons_source']);
      expect(camshaftReference.getSourceNamesForAnalysisType('trade-area')).toEqual(['source']);
    });
  });

  describe('.getParamNamesForAnalysisType', function () {
    it('should return the params names for a given analyses type', function () {
      expect(camshaftReference.getParamNamesForAnalysisType('source')).toEqual(['query']);
      expect(camshaftReference.getParamNamesForAnalysisType('point-in-polygon')).toEqual(['points_source', 'polygons_source']);
      expect(camshaftReference.getParamNamesForAnalysisType('trade-area')).toEqual(['source', 'kind', 'time', 'isolines', 'dissolved']);
    });
  });
});
