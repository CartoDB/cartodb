var WMSService = require('builder/data/wms-service');

describe('data/wms-service', function () {
  beforeEach(function () {
    this.wmsService = new WMSService();
  });

  it('should add necessary params', function () {
    var url = 'http://myURL';
    this.wmsService.setUrl(url);
    var resultURL = this.wmsService.generateURL({ method: 'create' });

    expect(resultURL.indexOf(encodeURIComponent('request=GetCapabilities'))).toBeGreaterThan(0);
    expect(resultURL.indexOf(encodeURIComponent('service=WMS'))).toBeGreaterThan(0);
    expect(resultURL.indexOf('type=wms')).toBeGreaterThan(0);
  });

  it("shouldn't remove extra params in the URL", function () {
    var url = 'http://myURL?request=GetCapabilities&service=WMS&type=wms&FORMAT=image/png24';
    this.wmsService.setUrl(url);
    var resultURL = this.wmsService.generateURL({ method: 'create' });

    expect(resultURL.indexOf(encodeURIComponent('FORMAT=image/png24'))).toBeGreaterThan(0);
    expect(resultURL.indexOf(encodeURIComponent('service=WMS'))).toBeGreaterThan(0);
  });

  it('should set the supported matrix sets to create a WMTS resource', function () {
    var url = 'http://myURL';
    this.wmsService.setUrl(url);
    var createURL = this.wmsService.saveLayerURL({
      wms_url: url,
      matrix_sets: ['EPSG:4326'],
      type: 'wmts',
      layer: 'foobar_layer'
    });

    expect(createURL).toContain('&layer=foobar_layer&');
    expect(createURL).toContain('&matrix_set=EPSG:4326');
  });

  describe('.url', function () {
    it('should add necessary params', function () {
      var url = 'http://myURL';
      this.wmsService.setUrl(url);

      expect(url).toEqual(this.wmsService._wms_url);
    });
  });

  describe('.supportedMatrixSets', function () {
    it('should return a subset of the supported matrix sets (used for a WMTS result)', function () {
      expect(this.wmsService.supportedMatrixSets(['foo', 'bar', 'EPSG:4258', 'baz', 'EPSG:4326'])).toEqual(['EPSG:4258', 'EPSG:4326']);
    });

    it('should return empty results for empty or missing input', function () {
      expect(this.wmsService.supportedMatrixSets()).toEqual([]);
      expect(this.wmsService.supportedMatrixSets([])).toEqual([]);
    });
  });
});
