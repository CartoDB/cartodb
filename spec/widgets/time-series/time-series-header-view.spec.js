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
      rangeFilter: this.rangeFilter,
      selectedAmount: 0
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

  describe('._initBinds', function () {
    it('calls ._animateValue if dataviewModel:totalAmount changes', function () {
      spyOn(this.view, '_animateValue');
      this.view._initBinds();
      this.view._dataviewModel.set('totalAmount', 10);

      expect(this.view._animateValue).toHaveBeenCalled();
    });

    it('calls .render if _rangeFilter changes', function () {
      spyOn(this.view, 'render');
      this.view._initBinds();
      this.view._rangeFilter.set('min', 5);

      expect(this.view.render).toHaveBeenCalled();
    });
  });
});
