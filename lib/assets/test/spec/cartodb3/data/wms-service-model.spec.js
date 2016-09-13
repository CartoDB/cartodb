var WMSServiceModel = require('../../../../javascripts/cartodb3/data/wms-service-model');
var CustomBaselayerModel = require('../../../../javascripts/cartodb3/data/custom-baselayer-model');

describe('data/wms-service-model', function () {
  describe('.url', function () {
    it('should add necessary params', function () {
      var url = 'http://myURL';
      var model = new WMSServiceModel({ wms_url: url });
      var resultURL = model.url('create');

      expect(resultURL.indexOf(encodeURIComponent('request=GetCapabilities'))).toBeGreaterThan(0);
      expect(resultURL.indexOf(encodeURIComponent('service=WMS'))).toBeGreaterThan(0);
      expect(resultURL.indexOf('type=wms')).toBeGreaterThan(0);
    });

    it("shouldn't remove extra params in the URL", function () {
      var url = 'http://myURL?request=GetCapabilities&service=WMS&type=wms&FORMAT=image/png24';
      var model = new WMSServiceModel({ wms_url: url });
      var resultURL = model.url('create');

      expect(resultURL.indexOf(encodeURIComponent('FORMAT=image/png24'))).toBeGreaterThan(0);
      expect(resultURL.indexOf(encodeURIComponent('service=WMS'))).toBeGreaterThan(0);
    });

    it('should set the supported matrix sets to create a WMTS resource', function () {
      var url = 'http://myURL';
      var model = new WMSServiceModel({
        wms_url: url,
        matrix_sets: ['EPSG:4326'],
        type: 'wmts',
        layer: 'foobar_layer'
      });
      var createURL = model.url('create');
      expect(createURL).toContain('&layer=foobar_layer&');
      expect(createURL).toContain('&matrix_set=EPSG:4326');
    });
  });

  describe('.newCustomBaselayerModel', function () {
    beforeEach(function () {
      this.model = new WMSServiceModel();
    });

    it('should throw an error unless mapproxy id is present', function () {
      expect(function () {
        this.model.newCustomBaselayerModel();
      }).toThrowError();
    });

    describe('when mapproxy id is present', function () {
      beforeEach(function () {
        this.model.set({
          mapproxy_id: 'abc123',
          attribution: 'attribution',
          name: 'tilelayer test',
          bounding_boxes: [1, 2, 3, 4]
        });
        this.customBaselayerModel = this.model.newCustomBaselayerModel();
      });

      it('should return a tilelayer object', function () {
        expect(this.customBaselayerModel).toEqual(jasmine.any(CustomBaselayerModel));
      });

      it('should should have expected attrs on returned object', function () {
        expect(this.customBaselayerModel.get('urlTemplate')).toMatch('/abc123/wmts/');
        expect(this.customBaselayerModel.get('attribution')).toEqual('attribution');
        expect(this.customBaselayerModel.get('maxZoom')).toEqual(21);
        expect(this.customBaselayerModel.get('minZoom')).toEqual(0);
        expect(this.customBaselayerModel.get('name')).toEqual('tilelayer test');
        expect(this.customBaselayerModel.get('proxy')).toBeTruthy();
        expect(this.customBaselayerModel.get('bounding_boxes')).toEqual([1, 2, 3, 4]);
      });
    });
  });

  describe('.supportedMatrixSets', function () {
    beforeEach(function () {
      this.model = new WMSServiceModel();
    });

    it('should return a subset of the supported matrix sets (used for a WMTS result)', function () {
      expect(this.model.supportedMatrixSets(['foo', 'bar', 'EPSG:4258', 'baz', 'EPSG:4326'])).toEqual(['EPSG:4258', 'EPSG:4326']);
    });

    it('should return empty results for empty or missing input', function () {
      expect(this.model.supportedMatrixSets()).toEqual([]);
      expect(this.model.supportedMatrixSets([])).toEqual([]);
    });
  });
});
