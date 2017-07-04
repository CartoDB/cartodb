var Backbone = require('backbone');
var TimeSeriesHeaderView = require('../../../src/widgets/time-series/time-series-header-view');
var AnimateValues = require('../../../src/widgets/animate-values.js');

describe('widgets/time-series/time-series-header-view', function () {
  var isFilterEmpty = true;

  beforeEach(function () {
    this.dataviewModel = new Backbone.Model({
      data: [{}]
    });

    this.rangeFilter = new Backbone.Model();
    this.rangeFilter.isEmpty = function () {
      return isFilterEmpty;
    };

    this.dataviewModel.layer = new Backbone.Model();
    this.view = new TimeSeriesHeaderView({
      dataviewModel: this.dataviewModel,
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

    it('should call to _animateValue', function () {
      spyOn(this.view, '_animateValue');

      this.view.render();

      expect(this.view._animateValue).toHaveBeenCalled();
    });

    it('should apply correct format types if selected and column is date', function () {
      isFilterEmpty = false;
      spyOn(this.view, '_getColumnType').and.returnValue('date');
      this.rangeFilter.set('min', 1451606400, { silent: true }); // 2016-01-01 00:00:00
      this.rangeFilter.set('max', 1483228799, { silent: true }); // 2016-12-31 23:59:59

      // Year
      this.dataviewModel.set('aggregation', 'year');

      this.view.render();

      expect(this.view.$('.CDB-Text').text()).toContain('Selected from 2016 to 2017');

      // Quarter
      this.dataviewModel.set('aggregation', 'quarter');

      this.view.render();

      expect(this.view.$('.CDB-Text').text()).toContain('Selected from Q1 2016 to Q1 2017');

      // Month
      this.dataviewModel.set('aggregation', 'month');

      this.view.render();

      expect(this.view.$('.CDB-Text').text()).toContain('Selected from Jan 2016 to Jan 2017');

      // Week
      this.dataviewModel.set('aggregation', 'week');

      this.view.render();

      expect(this.view.$('.CDB-Text').text()).toContain('Selected from 1st Jan 2016 to 7th Jan 2017');

      // Day
      this.dataviewModel.set('aggregation', 'day');

      this.view.render();

      expect(this.view.$('.CDB-Text').text()).toContain('Selected from 1st Jan 2016 to 1st Jan 2017');

      // Hour
      this.dataviewModel.set('aggregation', 'hour');

      this.view.render();

      expect(this.view.$('.CDB-Text').text()).toContain('Selected from 00:00 01/01/2016 to 00:59 01/01/2017');

      // Minute
      this.dataviewModel.set('aggregation', 'minute');

      this.view.render();

      expect(this.view.$('.CDB-Text').text()).toContain('Selected from 00:00 01/01/2016 to 00:00 01/01/2017');

      // Clean up
      this.rangeFilter.unset('min', { silent: true }); // 2016-01-01 00:00:00
      this.rangeFilter.unset('max', { silent: true }); // 2016-12-31 23:59:59
      this.dataviewModel.unset('aggregation');
      isFilterEmpty = true;
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

  describe('._animateValue', function () {
    it('should animate from _selectedAmount to totalAmount if no filter is present', function () {
      spyOn(AnimateValues.prototype, 'animateFromValues');
      this.view._selectedAmount = 49;
      this.view._dataviewModel.set('totalAmount', 69, { silent: true });

      this.view._animateValue();

      var args = AnimateValues.prototype.animateFromValues.calls.mostRecent().args;
      expect(args[0]).toBe(49);
      expect(args[1]).toBe(69);
    });

    it('should animate from _selectedAmount to filteredAmount if filter is present', function () {
      spyOn(AnimateValues.prototype, 'animateFromValues');
      spyOn(this.view._rangeFilter, 'isEmpty').and.returnValue(false);

      this.view._selectedAmount = 49;
      this.view._dataviewModel.set('totalAmount', 69, { silent: true });
      this.view._dataviewModel.set('filteredAmount', 89, { silent: true });

      this.view._animateValue();

      var args = AnimateValues.prototype.animateFromValues.calls.mostRecent().args;
      expect(args[0]).toBe(49);
      expect(args[1]).toBe(89);
    });
  });

  describe('._getColumnType', function () {
    it('should return "date" if dataviewModel has aggregation', function () {
      this.view._dataviewModel.set('aggregation', 'day');
      expect(this.view._getColumnType()).toEqual('date');
    });

    it('should return "number" if dataviewModel does not have aggregation', function () {
      this.view._dataviewModel.unset('aggregation');
      expect(this.view._getColumnType()).toEqual('number');
    });
  });
});
