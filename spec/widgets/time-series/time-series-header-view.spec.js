var Backbone = require('backbone');
var TimeSeriesHeaderView = require('../../../src/widgets/time-series/time-series-header-view');

describe('widgets/time-series/time-series-header-view', function () {
  var isFilterEmpty = true;

  beforeEach(function () {
    var dataviewModel = new Backbone.Model({
      data: [
        { bin: 0, start: 1, end: 2, freq: 1, min: 1, max: 1, avg: 1 },
        { bin: 1, start: 2, end: 3, freq: 1, min: 2, max: 3, avg: 4 }
      ]
    });

    this.selectionTotal = new Backbone.Model({ total: 0 });

    this.rangeFilter = new Backbone.Model();
    this.rangeFilter.isEmpty = function () {
      return isFilterEmpty;
    };

    dataviewModel.layer = new Backbone.Model();
    this.view = new TimeSeriesHeaderView({
      dataviewModel: dataviewModel,
      rangeFilter: this.rangeFilter,
      selectionTotal: this.selectionTotal
    });
  });

  describe('.render', function () {
    it('should show selection if filter has any value', function () {
      isFilterEmpty = false;
      this.rangeFilter.set({ min: 1, max: 2 });

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
    it('calls ._onTotalChange if selectionTotal:total changes', function () {
      spyOn(this.view, '_onTotalChange');
      this.view._initBinds();
      this.view._selectionTotal.set('total', 10);

      expect(this.view._onTotalChange).toHaveBeenCalled();
    });

    it('calls .render if _rangeFilter changes', function () {
      spyOn(this.view, 'render');
      this.view._initBinds();
      this.view._rangeFilter.set('min', 5);

      expect(this.view.render).toHaveBeenCalled();
    });
  });

  describe('._calcSum', function () {
    it('returns the sum of the freq in a range', function () {
      var data = [
        { freq: 1 },
        { freq: 2 },
        { freq: 3 },
        { freq: 4 },
        { freq: 5 }
      ];
      expect(this.view._calcSum(data, 2, 3)).toEqual(7);
    });
  });

  describe('._findBinsIndexes', function () {
    it('returns an object with the start and end bins', function () {
      var data = this.view._dataviewModel.get('data');
      expect(this.view._findBinsIndexes(data, 1, 3)).toEqual({
        start: 0,
        end: 1
      });
    });
  });

  describe('._calculateTotal', function () {
    beforeEach(function () {
      spyOn(this.view, '_findBinsIndexes').and.callThrough();
      spyOn(this.view, '_calcSum').and.callThrough();
      isFilterEmpty = false;
      this.rangeFilter.set({ min: 1, max: 3 });
    });

    it('calls ._findBinsIndexes and ._calcSum with the correct data', function () {
      var data = this.view._dataviewModel.get('data');
      var min = this.rangeFilter.get('min');
      var max = this.rangeFilter.get('max');
      var start = data[0].bin;
      var end = data[1].bin;

      expect(this.view._findBinsIndexes).toHaveBeenCalledWith(data, min, max)
      expect(this.view._calcSum).toHaveBeenCalledWith(data, start, end)
    });
  });
});
