var WMSViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/wms_model.js');

describe('common/dialog/add_custom_basemap/wms/wms_model', function() {
  beforeEach(function() {
    this.model = new WMSViewModel({
    });
  });

  it('should not have any layers initially', function() {
    expect(this.model.get('layers')).toBeUndefined();
  });

  describe('.fetchLayers', function() {
    beforeEach(function() {
      this.wmsService = new cdb.admin.WMSService();
      spyOn(this.wmsService, 'fetch');

      var self = this;
      spyOn(cdb.admin, 'WMSService').and.callFake(function() {
        return self.wmsService;
      });
      this.model.fetchLayers();
    });

    it('should fetch layers', function() {
      expect(this.wmsService.fetch).toHaveBeenCalled();
    });

    describe('when fetch succeeds', function() {
      describe('when there are layers', function() {
        beforeEach(function() {
          this.wmsService.set('layers', ['foobar']);
          this.wmsService.fetch.calls.argsFor(0)[0].success();
        });

        it('should set layers if there are at least one', function() {
          expect(this.model.get('layers').length).toBeGreaterThan(0);
        });
      });

      describe('when there are no layers', function() {
        beforeEach(function() {
          this.wmsService.fetch.calls.argsFor(0)[0].success();
        });

        it('should set layers to false if there are no layers', function() {
          expect(this.model.get('layers').length).toEqual(0);
        });
      });
    });

    describe('when fetch fails', function() {
      beforeEach(function() {
        this.wmsService.fetch.calls.argsFor(0)[0].error()
      });

      it('should indicate that there are no layers', function() {
        expect(this.model.get('layers').length).toEqual(0);
      });
    });
  });
});
