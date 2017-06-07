var Backbone = require('backbone');
var TimeSeriesHeaderView = require('../../../src/widgets/time-series/time-series-header-view');

describe('widgets/time-series/time-series-header-view', function () {
  var isFilterEmpty = true;

  beforeEach(function () {
    var dataviewModel = new Backbone.Model({
      data: [{}]
    });

    this.rangeFilter = new Backbone.Model();
    this.rangeFilter.isEmpty = function () {
      return isFilterEmpty;
    };

    dataviewModel.layer = new Backbone.Model();
    this.view = new TimeSeriesHeaderView({
      dataviewModel: dataviewModel,
      rangeFilter: this.rangeFilter
    });
  });

  describe('.render', function () {
    it('should show selection if filter has any value', function () {
      isFilterEmpty = false;

      this.view.render();

      expect(this.view.$el.html().indexOf('Selected from')).toBeGreaterThan(-1);
    });

    it('should not show selection if filter is empty', function () {
      isFilterEmpty = true;

      this.view.render();

      expect(this.view.$el.html().indexOf('Selected from')).toBe(-1);
    });
  });
});
