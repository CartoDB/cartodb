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

