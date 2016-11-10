var _ = require('underscore');
var Backbone = require('backbone');
var FeatureEvents = require('../../../src/vis/feature-events');

describe('src/vis/feature-events.js', function () {
  beforeEach(function () {
    this.layerView = {};
    _.extend(this.layerView, Backbone.Events);

    this.mapView = {
      getLayerViewByLayerCid: function () {
        return this.layerView;
      }.bind(this)
    };
    this.layersCollection = new Backbone.Collection();
    this.layerModel = new Backbone.Model();
    this.layersCollection.getCartoDBLayers = jasmine.createSpy('getCartoDBLayers').and.returnValue([
      this.layerModel
    ]);

    this.featureEvents = new FeatureEvents({
      mapView: this.mapView,
      layersCollection: this.layersCollection
    });

    this.featureOverCallback = jasmine.createSpy('featureOverCallback');
    this.featureEvents.on('featureOver', this.featureOverCallback);
    this.featureClickCallback = jasmine.createSpy('featureClickCallback');
    this.featureEvents.on('featureClick', this.featureClickCallback);
    this.featureOutCallback = jasmine.createSpy('featureOutCallback');
    this.featureEvents.on('featureOut', this.featureOutCallback);
  });

  describe('featureOver', function () {
    it('should retrigger featureOver events from the layerView', function () {
      var layerIndex = 0;
      this.layerView.trigger('featureOver', {}, [0, 180], { x: 10, y: 20 }, { name: 'Madrid' }, layerIndex);

      expect(this.featureOverCallback).toHaveBeenCalledWith({
        layer: this.layerModel,
        latlng: [0, 180],
        position: {
          x: 10,
          y: 20
        },
        feature: {
          name: 'Madrid'
        }
      });
    });

    it('should NOT retrigger featureOver events from the layerView if layer doesn\'t exist', function () {
      var layerIndex = 1000; // there aren't 1000 CartoDB Layers in this test!
      this.layerView.trigger('featureOver', {}, [0, 180], { x: 10, y: 20 }, { name: 'Madrid' }, layerIndex);

      expect(this.featureOverCallback).not.toHaveBeenCalled();
    });
  });

  describe('featureClick', function () {
    it('should retrigger featureClick events from the layerView', function () {
      var layerIndex = 0;
      this.layerView.trigger('featureClick', {}, [0, 180], { x: 10, y: 20 }, { name: 'Madrid' }, layerIndex);

      expect(this.featureClickCallback).toHaveBeenCalledWith({
        layer: this.layerModel,
        latlng: [0, 180],
        position: {
          x: 10,
          y: 20
        },
        feature: {
          name: 'Madrid'
        }
      });
    });

    it('should NOT retrigger featureClick events from the layerView if layer doesn\'t exist', function () {
      var layerIndex = 1000; // there aren't 1000 CartoDB Layers in this test!
      this.layerView.trigger('featureClick', {}, [0, 180], { x: 10, y: 20 }, { name: 'Madrid' }, layerIndex);

      expect(this.featureClickCallback).not.toHaveBeenCalled();
    });
  });

  describe('featureOut', function () {
    it('should retrigger featureOut events from the layerView', function () {
      var layerIndex = 0;
      this.layerView.trigger('featureOut', null, layerIndex);

      expect(this.featureOutCallback).toHaveBeenCalledWith({
        layer: this.layerModel
      });
    });

    it('should NOT retrigger featureOut events from the layerView if layer doesn\'t exist', function () {
      var layerIndex = 1000; // there aren't 1000 CartoDB Layers in this test!
      this.layerView.trigger('featureOut', null, layerIndex);

      expect(this.featureOutCallback).not.toHaveBeenCalled();
    });
  });
});
