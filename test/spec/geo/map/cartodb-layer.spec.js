var _ = require('underscore');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var sharedTestsForInteractiveLayers = require('./shared-for-interactive-layers');
var createEngine = require('../../fixtures/engine.fixture.js');

describe('geo/map/cartodb-layer', function () {
  var engineMock;

  beforeEach(function () {
    engineMock = createEngine();
  });

  sharedTestsForInteractiveLayers(CartoDBLayer);

  it('should be type CartoDB', function () {
    var layer = new CartoDBLayer({}, { engine: engineMock });
    expect(layer.get('type')).toEqual('CartoDB');
  });

  it('should expose infowindow and tooltip properties', function () {
    var layer = new CartoDBLayer({}, { engine: engineMock });
    expect(layer.infowindow).toBeDefined();
    expect(layer.tooltip).toBeDefined();
  });

  describe('vis reloading', function () {
    var ATTRIBUTES = ['sql', 'source', 'sql_wrap', 'cartocss'];

    _.each(ATTRIBUTES, function (attribute) {
      it("should reload the vis when '" + attribute + "' attribute changes", function () {
        var layer = new CartoDBLayer({}, { engine: engineMock });

        layer.set(attribute, 'new_value');

        expect(engineMock.reload).toHaveBeenCalled();
      });
    });

    it('should reload the map just once when multiple attributes change', function () {
      var layer = new CartoDBLayer({}, { engine: engineMock });

      var newAttributes = {};
      _.each(ATTRIBUTES, function (attr, index) {
        newAttributes[attr] = 'new_value_' + index;
      });
      layer.set(newAttributes);

      expect(engineMock.reload).toHaveBeenCalled();
      expect(engineMock.reload.calls.count()).toEqual(1);
    });

    describe('popups changes', function () {
      var layer;
      beforeEach(function () {
        layer = new CartoDBLayer({}, { engine: engineMock });
      });

      describe('infowindow bind', function () {
        it('should reload the map when infowindow fields are reset', function () {
          layer.infowindow.fields.reset([
            {
              'name': 'name',
              'title': true,
              'position': 1
            }
          ]);

          expect(engineMock.reload).toHaveBeenCalled();
        });

        it('should reload the map when infowindow fields are added', function () {
          layer.infowindow.fields.add({
            'name': 'name',
            'title': true,
            'position': 1
          });

          expect(engineMock.reload).toHaveBeenCalled();
        });

        it('should reload the map when infowindow fields are removed', function () {
          layer.infowindow.fields.add({
            'name': 'name',
            'title': true,
            'position': 1
          });

          engineMock.reload.calls.reset();

          layer.infowindow.fields.add({
            'name': 'name',
            'title': true,
            'position': 1
          });

          layer.infowindow.fields.remove(layer.infowindow.fields.at(0));

          expect(engineMock.reload).toHaveBeenCalled();
        });
      });

      describe('tooltip bind', function () {
        it('should reload the map when tooltip fields are reset', function () {
          layer.tooltip.fields.reset([
            {
              'name': 'hello',
              'title': false,
              'position': 1
            }
          ]);

          expect(engineMock.reload).toHaveBeenCalled();
        });

        it('should reload the map when tooltip fields are added', function () {
          layer.tooltip.fields.add({
            'name': 'pericamen',
            'title': false,
            'position': 1
          });

          expect(engineMock.reload).toHaveBeenCalled();
        });

        it('should reload the map when tooltip fields are removed', function () {
          layer.tooltip.fields.add({
            'name': 'rename',
            'title': true,
            'position': 1
          });

          engineMock.reload.calls.reset();

          layer.tooltip.fields.add({
            'name': 'name',
            'title': true,
            'position': 1
          });

          layer.tooltip.fields.remove(layer.tooltip.fields.at(0));

          expect(engineMock.reload).toHaveBeenCalled();
        });
      });
    });
  });

  describe('.isInteractive', function () {
    var layer, infowindowSpy, tooltipSpy;

    beforeEach(function () {
      layer = new CartoDBLayer({}, { engine: engineMock });

      infowindowSpy = spyOn(layer, '_hasInfowindowFields');
      tooltipSpy = spyOn(layer, '_hasTooltipFields');
    });

    it('returns true if there are selected fields', function () {
      infowindowSpy.and.returnValue(true);
      tooltipSpy.and.returnValue(false);
      expect(layer.isInteractive()).toBe(true);

      infowindowSpy.and.returnValue(false);
      tooltipSpy.and.returnValue(true);
      expect(layer.isInteractive()).toBe(true);
    });

    it('returns true if there are selected fields', function () {
      infowindowSpy.and.returnValue(false);
      tooltipSpy.and.returnValue(false);
      expect(layer.isInteractive()).toBe(false);
    });
  });

  describe('.getInteractiveColumnNames', function () {
    it("should return 'cartodb_id' and the names of the fields for infowindows and tooltips with no duplicates", function () {
      this.layer = new CartoDBLayer({
        infowindow: {
          fields: [
            { name: 'a' },
            { name: 'b' }
          ]
        },
        tooltip: {
          fields: [
            { name: 'b' },
            { name: 'c' }
          ]
        }
      }, { engine: engineMock });

      expect(this.layer.getInteractiveColumnNames()).toEqual(['cartodb_id', 'a', 'b', 'c']);
    });

    it("should return the 'cartodb_id' if no fields are present", function () {
      this.layer = new CartoDBLayer({
        infowindow: {
          fields: []
        },
        tooltip: {
          fields: []
        }
      }, { engine: engineMock });

      expect(this.layer.getInteractiveColumnNames()).toEqual(['cartodb_id']);
    });
  });

  describe('.getEstimatedFeatureCount', function () {
    var layer;

    beforeEach(function () {
      layer = new CartoDBLayer({}, { engine: engineMock });
    });
    it('should return undefined when there is no meta information', function () {
      layer.set('meta', {
        stats: {}
      });
      expect(layer.getEstimatedFeatureCount()).toBeUndefined();
    });
    it('should return the number of features extracted from the meta-information when the layer is visible', function () {
      layer.show();
      layer.set('meta', {
        stats: {
          estimatedFeatureCount: 27
        }
      });
      expect(layer.getEstimatedFeatureCount()).toEqual(27);
    });
    it('should return the number of features extracted from the meta-information when the layer is invisible', function () {
      layer.hide();
      layer.set('meta', {
        stats: {
          estimatedFeatureCount: 27
        }
      });
      expect(layer.getEstimatedFeatureCount()).toEqual(27);
    });
  });
});
