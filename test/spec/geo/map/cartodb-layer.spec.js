var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var sharedTestsForInteractiveLayers = require('./shared-for-interactive-layers');

describe('geo/map/cartodb-layer', function () {
  sharedTestsForInteractiveLayers(CartoDBLayer);

  it('should be type CartoDB', function () {
    var layer = new CartoDBLayer();
    expect(layer.get('type')).toEqual('CartoDB');
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
