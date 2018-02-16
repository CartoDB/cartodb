var _ = require('underscore');
var Backbone = require('backbone');
var widgetsTypes = require('builder/components/modals/add-widgets/widgets-types');
var TimeSeriesNoneOptionModel = require('builder/components/modals/add-widgets/time-series/time-series-none-option-model');

describe('components/modals/add-widgets/widgets-types', function () {
  describe('all items', function () {
    it('should have a type prop', function () {
      widgetsTypes.forEach(function (d) {
        expect(d.type).toMatch(/\w+/);
      });
    });

    it('should have a createTabPaneItem method', function () {
      widgetsTypes.forEach(function (d) {
        expect(d.createTabPaneItem).toEqual(jasmine.any(Function));
      });
    });
  });

  describe('times-series', function () {
    beforeEach(function () {
      this.d = _.find(widgetsTypes, function (d) {
        return d.type === 'time-series';
      });
    });

    describe('.createOptionModels', function () {
      it('should always create a none-option even if there are no tuples items', function () {
        var widgetDefinitionsCollection = new Backbone.Collection();
        var models = this.d.createOptionModels([], widgetDefinitionsCollection);
        expect(models.length).toEqual(1);
        expect(models[0]).toEqual(jasmine.any(TimeSeriesNoneOptionModel));
      });
    });
  });
});
