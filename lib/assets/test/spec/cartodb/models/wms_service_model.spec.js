describe("cdb.admin.WMSService ", function() {
  describe('.url', function() {
    it("should add necessary params", function() {
      var url = "http://myURL";
      var model = new cdb.admin.WMSService({ wms_url: url });
      var resultURL = model.url("create");

      expect(resultURL.indexOf(encodeURIComponent("request=GetCapabilities"))).toBeGreaterThan(0);
      expect(resultURL.indexOf(encodeURIComponent("service=WMS"))).toBeGreaterThan(0);
      expect(resultURL.indexOf("type=wms")).toBeGreaterThan(0);
    });

    it("shouldn't remove extra params in the URL", function() {
      var url = "http://myURL?request=GetCapabilities&service=WMS&type=wms&FORMAT=image/png24";
      var model = new cdb.admin.WMSService({ wms_url: url });
      var resultURL = model.url("create");

      expect(resultURL.indexOf(encodeURIComponent("FORMAT=image/png24"))).toBeGreaterThan(0);
      expect(resultURL.indexOf(encodeURIComponent("service=WMS"))).toBeGreaterThan(0);
    });

    it('should set the supported matrix sets to create a WMTS resource', function() {
      var url = 'http://myURL';
      var model = new cdb.admin.WMSService({
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

  describe('.newTileLayer', function() {
    beforeEach(function() {
      this.model = new cdb.admin.WMSService({
      });
    });

    it('should throw an error unless mapproxy id is present', function() {
      expect(function() {
        this.model.newTileLayer();
      }).toThrowError();
    });

    describe('when mapproxy id is present', function() {
      beforeEach(function() {
        this.model.set({
          mapproxy_id: 'abc123',
          attribution: 'attribution',
          name: 'tilelayer test',
          bounding_boxes: [1,2,3,4]
        });
        this.tileLayer = this.model.newTileLayer();
      });

      it('should return a tilelayer object', function() {
        expect(this.tileLayer).toEqual(jasmine.any(cdb.admin.TileLayer));
      });

      it('should should have expected attrs on returned object', function() {
        expect(this.tileLayer.get('urlTemplate')).toMatch('/abc123/wmts/');
        expect(this.tileLayer.get('attribution')).toEqual('attribution');
        expect(this.tileLayer.get('maxZoom')).toEqual(21);
        expect(this.tileLayer.get('minZoom')).toEqual(0);
        expect(this.tileLayer.get('name')).toEqual('tilelayer test');
        expect(this.tileLayer.get('proxy')).toBeTruthy();
        expect(this.tileLayer.get('bounding_boxes')).toEqual([1,2,3,4]);
      });
    });
  });

  describe('::supportedMatrixSets', function() {
    it('should return a subset of the supported matrix sets (used for a WMTS result)', function() {
      expect(cdb.admin.WMSService.supportedMatrixSets(['foo', 'bar', 'EPSG:4258', 'baz', 'EPSG:4326'])).toEqual(['EPSG:4258', 'EPSG:4326']);
    });

    it('should return empty results for empty or missing input', function() {
      expect(cdb.admin.WMSService.supportedMatrixSets()).toEqual([]);
      expect(cdb.admin.WMSService.supportedMatrixSets([])).toEqual([]);
    });
  });
});
