var Backbone = require('backbone');
var MapCursorManager = require('../../../src/vis/map-cursor-manager');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');

var createLayerModel = function () {
  var layerModel = new CartoDBLayer(null, { vis: { reload: function () {}, on: function () {} } });
  layerModel.isInfowindowEnabled = jasmine.createSpy('isInfowindowEnabled');
  return layerModel;
};

describe('src/vis/map-cursor-manager.js', function () {
  beforeEach(function () {
    this.mapView = jasmine.createSpyObj('mapView', ['setCursor']);
    this.mapModel = jasmine.createSpyObj('map', ['arePopupsEnabled', 'isFeatureInteractivityEnabled']);
    this.layerModel = createLayerModel();
    this.cartoDBLayerGroupView = new Backbone.View();
    this.mapCursorManager = new MapCursorManager({
      mapView: this.mapView,
      mapModel: this.mapModel
    });

    this.mapCursorManager.start(this.cartoDBLayerGroupView);
  });

  describe('when a feature is overed', function () {
    beforeEach(function () {
      this.mapModel.arePopupsEnabled.and.returnValue(false);
      this.mapModel.isFeatureInteractivityEnabled.and.returnValue(false);
      this.layerModel.isInfowindowEnabled.and.returnValue(false);
    });

    it('should NOT change the cursor to pointer if layer is not clickable', function () {
      this.cartoDBLayerGroupView.trigger('featureOver', {
        layer: this.layerModel
      });

      expect(this.mapView.setCursor).not.toHaveBeenCalled();
    });

    it('should change the cursor to pointer if feature interactivity is enabled', function () {
      this.mapModel.isFeatureInteractivityEnabled.and.returnValue(true);
      this.cartoDBLayerGroupView.trigger('featureOver', {
        layer: this.layerModel
      });

      expect(this.mapView.setCursor).toHaveBeenCalledWith('pointer');
    });

    describe('when popups are enabled', function () {
      beforeEach(function () {
        this.mapModel.arePopupsEnabled.and.returnValue(true);
      });

      it('should NOT change the cursor to pointer if layer has NO infowindow enabled', function () {
        this.cartoDBLayerGroupView.trigger('featureOver', {
          layer: this.layerModel
        });

        expect(this.mapView.setCursor).not.toHaveBeenCalled();
      });

      it('should change the cursor to pointer if layer infowindows enabled', function () {
        this.layerModel.isInfowindowEnabled.and.returnValue(true);
        this.cartoDBLayerGroupView.trigger('featureOver', {
          layer: this.layerModel
        });

        expect(this.mapView.setCursor).toHaveBeenCalledWith('pointer');
      });
    });
  });

  describe('when a feature is not overed anymore', function () {
    beforeEach(function () {
      this.mapModel.isFeatureInteractivityEnabled.and.returnValue(true);

      this.cartoDBLayerGroupView.trigger('featureOver', {
        layer: this.layerModel
      });

      expect(this.mapView.setCursor).toHaveBeenCalledWith('pointer');
      this.mapView.setCursor.calls.reset();
    });

    it('should change the cursor to auto if no other layer is being overed', function () {
      this.cartoDBLayerGroupView.trigger('featureOut', {
        layer: this.layerModel
      });

      expect(this.mapView.setCursor).toHaveBeenCalledWith('auto');
    });

    it('should change the cursor to pointer if other clickable layers are still being overed', function () {
      var anotherLayerModel = createLayerModel();

      // Another layer is being overed
      this.cartoDBLayerGroupView.trigger('featureOver', {
        layer: anotherLayerModel
      });

      expect(this.mapView.setCursor).toHaveBeenCalledWith('pointer');
      expect(this.mapView.setCursor.calls.reset());

      // First layer is not overed anymore
      this.cartoDBLayerGroupView.trigger('featureOut', {
        layer: this.layerModel
      });

      expect(this.mapView.setCursor).toHaveBeenCalledWith('pointer');
    });
  });

  describe('when a feature was overed and layer visibility changes', function () {
    beforeEach(function () {
      this.mapModel.isFeatureInteractivityEnabled.and.returnValue(true);
      this.cartoDBLayerGroupView.trigger('featureOver', {
        layer: this.layerModel
      });

      expect(this.mapView.setCursor).toHaveBeenCalledWith('pointer');
    });

    it('should change the cursor to auto if layer is hidden', function () {
      this.mapView.setCursor.calls.reset();

      this.layerModel.set('visible', false);

      expect(this.mapView.setCursor).toHaveBeenCalledWith('auto');
    });

    it('should keep the cursor as pointer if layer is hidden but other clickable layers are visible', function () {
      var anotherLayerModel = createLayerModel();

      // Another layer is being overed
      this.cartoDBLayerGroupView.trigger('featureOver', {
        layer: anotherLayerModel
      });

      this.mapView.setCursor.calls.reset();

      this.layerModel.set('visible', false);

      expect(this.mapView.setCursor).toHaveBeenCalledWith('pointer');
    });
  });
});
