describe("Basemap WMS pane", function() {

  describe("cdb.admin.WMSService ", function() {

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

  });

  describe("cdb.admin.WMSBasemapChooserPane", function() {
    var view;

    beforeEach(function() {

      cdb.admin.WMSService.prototype._PROXY_URL = 'http://cartodb-wms.global.ssl.fastly.net/api';
      cdb.admin.WMSService.prototype._PROXY_TILES = 'http://cartodb-wms.global.ssl.fastly.net/mapproxy';

      view = new cdb.admin.WMSBasemapChooserPane();
    });

    it("should trigger a success event if the WMS is valid", function(done) {

      view.bind("chooseWMSLayers", function() {
        expect(true).toEqual(true);
        done();
      });

      var url = "http://geodata.nationaalgeoregister.nl/bevolkingskernen2008/wms";
      view.checkTileJson(url);

    });

    it("should keep parms", function(done) {

      view.bind("errorChooser", function() {
        expect(true).toEqual(true);
        done();
      });

      var url = "I'm not a URL, you know";

      view.checkTileJson(url);

    });

  });
});
