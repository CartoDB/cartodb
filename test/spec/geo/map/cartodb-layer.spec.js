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

    it('should reload the map when infowindow fields are reset', function () {
      var layer = new CartoDBLayer({}, { vis: this.vis });

      layer.infowindow.fields.reset([{ }]);

      expect(this.vis.reload).toHaveBeenCalled();
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

      expect(this.layer.getInteractiveColumnNames()).toEqual([ 'cartodb_id', 'a', 'b', 'c' ]);
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

      expect(this.layer.getInteractiveColumnNames()).toEqual([ 'cartodb_id' ]);
    });
  });
});
