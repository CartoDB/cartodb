var _ = require('underscore');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var sharedTestsForInteractiveLayers = require('./shared-for-interactive-layers');

describe('geo/map/cartodb-layer', function () {
  sharedTestsForInteractiveLayers(CartoDBLayer);

  it('should be type CartoDB', function () {
    var layer = new CartoDBLayer();
    expect(layer.get('type')).toEqual('CartoDB');
  });

  it('should expose infowindow and tooltip properties', function () {
    var layer = new CartoDBLayer();
    expect(layer.infowindow).toBeDefined();
    expect(layer.tooltip).toBeDefined();
  });

  _.each(['visible', 'sql', 'source', 'sql_wrap'], function (attribute) {
    it("should reload the map when '" + attribute + "' attribute changes", function () {
      var map = jasmine.createSpyObj('map', ['reload']);
      var layer = new CartoDBLayer({}, { map: map });

      layer.set(attribute, 'new_value');

      expect(map.reload).toHaveBeenCalled();
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
      });

      expect(this.layer.getInteractiveColumnNames()).toEqual([ 'cartodb_id', 'a', 'b', 'c' ]);
    });

    it('should return an empty array if no fields are present', function () {
      this.layer = new CartoDBLayer({
        infowindow: {
          fields: []
        },
        tooltip: {
          fields: []
        }
      });

      expect(this.layer.getInteractiveColumnNames()).toEqual([]);
    });
  });
});
