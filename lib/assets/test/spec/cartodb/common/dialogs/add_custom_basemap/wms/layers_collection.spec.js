var LayersCollection = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/layers_collection.js');

describe('common/dialog/add_custom_basemap/wms/layers_collection', function() {
  beforeEach(function() {
    this.layers = new LayersCollection();
  });

  describe('.fetch', function() {
    beforeEach(function() {
      this.url = 'http://openlayers.org/en/v3.5.0/examples/data/ogcsample.xml';
      this.callbackSpy = jasmine.createSpy();
      this.wmsService = new cdb.admin.WMSService();
      this.deferred = $.Deferred();
      spyOn(this.wmsService, 'fetch').and.returnValue(this.deferred);

      var self = this;
      spyOn(cdb.admin, 'WMSService').and.callFake(function() {
        return self.wmsService;
      });
      this.layers.fetch(this.url, this.callbackSpy);
    });

    it('should fetch layers from given URL', function() {
      expect(cdb.admin.WMSService.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ wms_url: this.url }));
      expect(this.wmsService.fetch).toHaveBeenCalled();
    });

    it('should not call callback just yet', function() {
      expect(this.callbackSpy).not.toHaveBeenCalled();
    });

    describe('when layers are fetched', function() {
      beforeEach(function() {
        this.wmsService.set('layers', [{},{},{}]);
        this.deferred.resolve();
      });

      it('should set layers on collection', function() {
        expect(this.layers.length).toEqual(3);
      });

      it('should call given callback', function() {
        expect(this.callbackSpy).toHaveBeenCalled();
      });
    });
  });
});
