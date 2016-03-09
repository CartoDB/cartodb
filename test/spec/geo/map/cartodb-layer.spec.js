var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var _ = require('underscore');
var sharedTestsForInteractiveLayers = require('./shared-for-interactive-layers');

describe('geo/map/cartodb-layer', function () {
  sharedTestsForInteractiveLayers(CartoDBLayer);

  it('should be type CartoDB', function () {
    var layer = new CartoDBLayer();
    expect(layer.get('type')).toEqual('CartoDB');
  });

  describe('.getInteractiveColumnNames', function () {
    beforeEach(function () {
      this.layer = new CartoDBLayer();
      spyOn(this.layer, 'getInfowindowFieldNames');
      spyOn(this.layer, 'getTooltipFieldNames');
    });

    it('should include cartodb_id if there is any other field required from the infowindow or tooltip', function () {
      this.layer.getInfowindowFieldNames.and.returnValue(['column_a']);
      this.layer.getTooltipFieldNames.and.returnValue([]);
      expect(_.contains(this.layer.getInteractiveColumnNames(), 'cartodb_id')).toBeTruthy();

      this.layer.getInfowindowFieldNames.and.returnValue([]);
      this.layer.getTooltipFieldNames.and.returnValue(['column_b']);
      expect(_.contains(this.layer.getInteractiveColumnNames(), 'cartodb_id')).toBeTruthy();
    });

    it("should not include cartodb_id if there isn't any field required", function () {
      this.layer.getInfowindowFieldNames.and.returnValue([]);
      this.layer.getTooltipFieldNames.and.returnValue([]);
      expect(_.contains(this.layer.getInteractiveColumnNames(), 'cartodb_id')).toBeFalsy();
    });
  });
});
