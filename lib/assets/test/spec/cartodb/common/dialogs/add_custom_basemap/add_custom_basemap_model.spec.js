var AddCustomBasemapModel = require('../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/add_custom_basemap_model.js');

describe('common/dialog/add_custom_basemap/add_custom_basemap_model', function() {
  beforeEach(function() {
    this.baseLayers = jasmine.createSpyObj('user.baseLayers', ['add']);
    this.map = jasmine.createSpyObj('map', ['setBounds', 'changeProvider']);
    this.model = new AddCustomBasemapModel({
      map: this.map,
      baseLayers: this.baseLayers
    });
  });

  it('should start with tabs for current view', function() {
    expect(this.model.get('currentView')).toEqual('tabs');
  });

  it('should start on XYZ tab', function() {
    expect(this.model.get('currentTab')).toEqual('xyz');
  });

  describe('.activeTabModel', function() {
    it('should return the model for current tab', function() {
      expect(this.model.activeTabModel()).toEqual(jasmine.any(Object));
    });
  });

  describe('.saveLayer', function() {
    beforeEach(function() {
      this.layer = new cdb.admin.TileLayer({
        bounding_boxes: [1, 2, 3, 4]
      });
      this.deferred = $.Deferred();
      spyOn(this.layer, 'save').and.returnValue(this.deferred);
      this.successCallback = jasmine.createSpy('success');
      this.errorCallback = jasmine.createSpy('error');
      this.model.saveLayer(this.layer, {
        success: this.successCallback,
        error: this.errorCallback
      }); // same as for XYZ use-case
    });

    it('should set bounding box on map', function() {
      expect(this.map.setBounds).toHaveBeenCalled();
      expect(this.map.setBounds.calls.argsFor(0)[0]).toEqual([[2, 1], [4, 3]]);
    });

    it('should add layer to baselayers', function() {
      expect(this.baseLayers.add).toHaveBeenCalled();
      expect(this.baseLayers.add).toHaveBeenCalledWith(this.layer);
    });

    it('should call save on layer', function() {
      expect(this.layer.save).toHaveBeenCalled();
    });

    describe('when save succeeds', function() {
      beforeEach(function() {
        this.deferred.resolve();
      });

      it('should change provider of map', function() {
        expect(this.map.changeProvider).toHaveBeenCalled();
        expect(this.map.changeProvider.calls.argsFor(0)[0]).toEqual('leaflet');
        expect(this.map.changeProvider.calls.argsFor(0)[1] instanceof cdb.admin.TileLayer).toBeTruthy();
        expect(this.map.changeProvider.calls.argsFor(0)[1]).not.toBe(this.layer);
      });

      it('should call success callback', function() {
        expect(this.successCallback).toHaveBeenCalled();
      });
    });

    describe('when save fails', function() {
      beforeEach(function() {
        this.deferred.reject();
      });

      it('should call error callback', function() {
        expect(this.errorCallback).toHaveBeenCalled();
      });
    });
  });
});
