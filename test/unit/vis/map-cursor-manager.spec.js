var _ = require('underscore');
var Backbone = require('backbone');
var MapCursorManager = require('../../../src/vis/map-cursor-manager');

describe('src/vis/map-cursor-manager.js', function () {
  beforeEach(function () {
    this.mapView = jasmine.createSpyObj('mapView', ['setCursor']);
    this.mapModel = jasmine.createSpyObj('map', ['arePopupsEnabled', 'isFeatureInteractivityEnabled']);
    this.featureEvents = _.extend({}, Backbone.Events);
    this.layerModel = jasmine.createSpyObj('layerModel', ['isInfowindowEnabled']);
    this.layerModel.cid = 'layer1';

    this.mapCursorManager = new MapCursorManager({
      mapView: this.mapView,
      mapModel: this.mapModel,
      featureEvents: this.featureEvents
    });
  });

  describe('when a feature is overed', function () {
    beforeEach(function () {
      this.mapModel.arePopupsEnabled.and.returnValue(false);
      this.mapModel.isFeatureInteractivityEnabled.and.returnValue(false);
      this.layerModel.isInfowindowEnabled.and.returnValue(false);
    });

    it('should NOT change the cursor to pointer if layer is not clickable', function () {
      this.featureEvents.trigger('featureOver', {
        layer: this.layerModel
      });

      expect(this.mapView.setCursor).not.toHaveBeenCalled();
    });

    it('should change the cursor to pointer if feature interactivity is enabled', function () {
      this.mapModel.isFeatureInteractivityEnabled.and.returnValue(true);
      this.featureEvents.trigger('featureOver', {
        layer: this.layerModel
      });

      expect(this.mapView.setCursor).toHaveBeenCalledWith('pointer');
    });

    describe('when popups are enabled', function () {
      beforeEach(function () {
        this.mapModel.arePopupsEnabled.and.returnValue(true);
      });

      it('should NOT change the cursor to pointer if layer has NO infowindow enabled', function () {
        this.featureEvents.trigger('featureOver', {
          layer: this.layerModel
        });

        expect(this.mapView.setCursor).not.toHaveBeenCalled();
      });

      it('should change the cursor to pointer if layer has NO infowindow enabled', function () {
        this.layerModel.isInfowindowEnabled.and.returnValue(true);
        this.featureEvents.trigger('featureOver', {
          layer: this.layerModel
        });

        expect(this.mapView.setCursor).toHaveBeenCalledWith('pointer');
      });
    });
  });

  describe('when a feature is not overed anymore', function () {
    it('should change the cursor to auto', function () {
      this.featureEvents.trigger('featureOut', {
        layer: this.layerModel
      });

      expect(this.mapView.setCursor).toHaveBeenCalledWith('auto');
    });

    describe('when one or more clickable layers where overed', function () {
      beforeEach(function () {
        this.mapModel.isFeatureInteractivityEnabled.and.returnValue(true);

        this.featureEvents.trigger('featureOver', {
          layer: this.layerModel
        });

        expect(this.mapView.setCursor).toHaveBeenCalledWith('pointer');
        this.mapView.setCursor.calls.reset();
      });

      it('should change the cursor to auto if no other clickable layers have been overed', function () {
        this.featureEvents.trigger('featureOut', {
          layer: this.layerModel
        });

        expect(this.mapView.setCursor).toHaveBeenCalledWith('auto');
      });

      it('should NOT change the cursor if other clickable layers are still being overed', function () {
        var anotherLayerModel = jasmine.createSpyObj('layerModel', ['isInfowindowEnabled']);
        anotherLayerModel.cid = 'layer2';

        // Another layer is being overed
        this.featureEvents.trigger('featureOver', {
          layer: anotherLayerModel
        });

        expect(this.mapView.setCursor.calls.reset());

        // First layer is not overed anymore
        this.featureEvents.trigger('featureOut', {
          layer: this.layerModel
        });

        expect(this.mapView.setCursor).not.toHaveBeenCalled();
      });
    });
  });
});
