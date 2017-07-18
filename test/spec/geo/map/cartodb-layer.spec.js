var _ = require('underscore');
var Backbone = require('backbone');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var sharedTestsForInteractiveLayers = require('./shared-for-interactive-layers');

describe('geo/map/cartodb-layer', function () {
  beforeEach(function () {
    this.vis = new Backbone.Model();
    this.vis.reload = jasmine.createSpy('reload');
  });

  sharedTestsForInteractiveLayers(CartoDBLayer);

  it('should be type CartoDB', function () {
    var layer = new CartoDBLayer({}, { vis: this.vis });
    expect(layer.get('type')).toEqual('CartoDB');
  });

  it('should expose infowindow and tooltip properties', function () {
    var layer = new CartoDBLayer({}, { vis: this.vis });
    expect(layer.infowindow).toBeDefined();
    expect(layer.tooltip).toBeDefined();
  });

  describe('vis reloading', function () {
    var ATTRIBUTES = ['sql', 'source', 'sql_wrap', 'cartocss'];

    _.each(ATTRIBUTES, function (attribute) {
      it("should reload the vis when '" + attribute + "' attribute changes", function () {
        var layer = new CartoDBLayer({}, { vis: this.vis });

        layer.set(attribute, 'new_value');

        expect(this.vis.reload).toHaveBeenCalled();
      });
    });

    it('should reload the map just once when multiple attributes change', function () {
      var layer = new CartoDBLayer({}, { vis: this.vis });

      var newAttributes = {};
      _.each(ATTRIBUTES, function (attr, index) {
        newAttributes[attr] = 'new_value_' + index;
      });
      layer.set(newAttributes);

      expect(this.vis.reload).toHaveBeenCalled();
      expect(this.vis.reload.calls.count()).toEqual(1);
    });

    it('should NOT reload the map if cartocss has changed and layer has a dataProvider', function () {
      var layer = new CartoDBLayer({}, { vis: this.vis });
      layer.setDataProvider('wadus');

      layer.set('cartocss', 'new_value');

      expect(this.vis.reload).not.toHaveBeenCalled();
    });

    describe('popups changes', function () {
      var layer;
      beforeEach(function () {
        layer = new CartoDBLayer({}, { vis: this.vis });
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

          expect(this.vis.reload).toHaveBeenCalled();
        });

        it('should reload the map when infowindow fields are added', function () {
          layer.infowindow.fields.add({
            'name': 'name',
            'title': true,
            'position': 1
          });

          expect(this.vis.reload).toHaveBeenCalled();
        });

        it('should reload the map when infowindow fields are removed', function () {
          layer.infowindow.fields.add({
            'name': 'name',
            'title': true,
            'position': 1
          });

          this.vis.reload.calls.reset();

          layer.infowindow.fields.add({
            'name': 'name',
            'title': true,
            'position': 1
          });

          layer.infowindow.fields.remove(layer.infowindow.fields.at(0));

          expect(this.vis.reload).toHaveBeenCalled();
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

          expect(this.vis.reload).toHaveBeenCalled();
        });

        it('should reload the map when tooltip fields are added', function () {
          layer.tooltip.fields.add({
            'name': 'pericamen',
            'title': false,
            'position': 1
          });

          expect(this.vis.reload).toHaveBeenCalled();
        });

        it('should reload the map when tooltip fields are removed', function () {
          layer.tooltip.fields.add({
            'name': 'rename',
            'title': true,
            'position': 1
          });

          this.vis.reload.calls.reset();

          layer.tooltip.fields.add({
            'name': 'name',
            'title': true,
            'position': 1
          });

          layer.tooltip.fields.remove(layer.tooltip.fields.at(0));

          expect(this.vis.reload).toHaveBeenCalled();
        });
      });
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
      }, { vis: this.vis });

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
      }, { vis: this.vis });

      expect(this.layer.getInteractiveColumnNames()).toEqual(['cartodb_id']);
    });
  });

  describe('.getEstimatedFeatureCount', function () {
    var layer;

    beforeEach(function () {
      layer = new CartoDBLayer({}, { vis: this.vis });
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
