var cdb = require('cartodb.js');
var $ = require('jquery');
var WMSViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/wms_model.js');

describe('common/dialog/add_custom_basemap/wms/wms_model', function() {
  beforeEach(function() {
    this.model = new WMSViewModel({
    });
  });

  it('should not have any layers initially', function() {
    expect(this.model.get('layers').length).toEqual(0);
  });

  describe('.fetchLayers', function() {
    beforeEach(function() {
      this.wmsService = new cdb.admin.WMSService();
      this.deferred = $.Deferred();
      spyOn(this.wmsService, 'fetch').and.returnValue(this.deferred);

      var self = this;
      spyOn(cdb.admin, 'WMSService').and.callFake(function() {
        return self.wmsService;
      });
      this.url = 'http://openlayers.org/en/v3.5.0/examples/data/ogcsample.xml';
      this.model.fetchLayers(this.url);
    });

    it('should fetch layers from given URL', function() {
      expect(cdb.admin.WMSService.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ wms_url: this.url }));
      expect(this.wmsService.fetch).toHaveBeenCalled();
    });

    it('should indicate that layers are not fetched yet', function() {
      expect(this.model.get('layersFetched')).toBeFalsy();
    });

    describe('when fetch succeeds', function() {
      describe('when there are layers', function() {
        beforeEach(function() {
          this.wmsService.set('layers', ['foobar']);
          this.deferred.resolve();
        });

        it('should set layers if there are at least one', function() {
          expect(this.model.get('layers').length).toBeGreaterThan(0);
        });

        it('should indicate that layers are fetched', function() {
          expect(this.model.get('layersFetched')).toBeTruthy();
        });
      });

      describe('when there are no layers', function() {
        beforeEach(function() {
          this.deferred.resolve();
        });

        it('should not have any layers set', function() {
          expect(this.model.get('layers').length).toEqual(0);
        });

        it('should indicate that layers are fetched', function() {
          expect(this.model.get('layersFetched')).toBeTruthy();
        });
      });
    });

    describe('when fetch fails', function() {
      beforeEach(function() {
        this.deferred.reject();
      });

      it('should indicate that there are no layers', function() {
        expect(this.model.get('layers').length).toEqual(0);
      });
    });
  });
});
