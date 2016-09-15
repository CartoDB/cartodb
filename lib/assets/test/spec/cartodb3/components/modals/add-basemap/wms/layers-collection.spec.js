var LayersCollection = require('../../../../../../../javascripts/cartodb3/components/modals/add-basemap/wms/wms-layers-collection');
var $ = require('jquery');

describe('editor/components/modals/add-basemap/wms/layers-collection', function () {
  beforeEach(function () {
    this.layers = new LayersCollection();
  });

  describe('.fetch', function () {
    beforeEach(function () {
      this.url = 'http://openlayers.org/en/v3.5.0/examples/data/ogcsample.xml';
      this.callbackSpy = jasmine.createSpy();
      this.wms = new this.layers.WMSServiceModel();
      this.deferred = $.Deferred();
      spyOn(this.wms, 'fetch').and.returnValue(this.deferred);

      var self = this;
      spyOn(this.layers, 'WMSServiceModel').and.callFake(function () {
        return self.wms;
      });
      this.layers.fetch(this.url, this.callbackSpy);
    });

    it('should fetch layers from given URL', function () {
      expect(this.layers.WMSServiceModel.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ wms_url: this.url }));
      expect(this.wms.fetch).toHaveBeenCalled();
    });

    it('should not call callback just yet', function () {
      expect(this.callbackSpy).not.toHaveBeenCalled();
    });

    describe('when layers are fetched', function () {
      beforeEach(function () {
        this.wms.set('layers', [{}, {}, {}]);
        this.deferred.resolve();
      });

      it('should set layers on collection', function () {
        expect(this.layers.length).toEqual(3);
      });

      it('should call given callback', function () {
        expect(this.callbackSpy).toHaveBeenCalled();
      });
    });
  });
});
