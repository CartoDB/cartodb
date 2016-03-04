var _ = require('underscore');
var specHelper = require('../../spec-helper');
var HistogramContentView = require('../../../src/widgets/histogram/content-view');
var HistogramWidgetModel = require('../../../src/widgets/histogram/histogram-widget-model');

describe('widgets/histogram/content-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createHistogramModel(vis.map.layers.first(), {
      id: 'widget_3',
      column: 'col'
    });

    this.widgetModel = new HistogramWidgetModel({
      title: 'Howdy',
      attrsNames: ['title']
    }, {
      dataviewModel: this.dataviewModel
    });

    this.view = new HistogramContentView({
      model: this.widgetModel,
      dataviewModel: this.dataviewModel
    });
  });

  it('should render the histogram', function () {
    spyOn(this.view, 'render').and.callThrough();
    this.dataviewModel._data.reset(genHistogramData(20));
    this.dataviewModel.trigger('change:data');
    expect(this.view.render).toHaveBeenCalled();
    expect(this.view.$('h3').text()).toBe('Howdy');
  });

  it('should reset original data when render the histogram and there is data', function () {
    spyOn(this.view._originalData, 'reset');
    this.dataviewModel._data.reset(genHistogramData(20));
    this.dataviewModel.trigger('change:data');
    expect(this.view._originalData.reset).toHaveBeenCalled();
  });

  it('should revert the lockedByUser state when the model is changed', function () {
    spyOn(this.view, '_unsetRange').and.callThrough();

    this.dataviewModel.sync = function (method, model, options) {
      options.success({ 'response': true });
    };

    this.widgetModel.set('zoomed', true);
    this.dataviewModel.fetch();

    expect(this.view._unsetRange).not.toHaveBeenCalled();

    this.view.lockedByUser = true;
    this.dataviewModel.set('url', 'test');

    expect(this.view.lockedByUser).toBe(true);
  });

  it("shouldn't revert the lockedByUser state when the url is changed and the histogram is zoomed", function () {
    this.dataviewModel.sync = function (method, model, options) {
      options.success({ 'response': true });
    };

    this.view.lockedByUser = true;
    this.dataviewModel.fetch();
    this.dataviewModel.trigger('change:data');
    expect(this.view.lockedByUser).toBe(false);
  });

  it('should unset the range when the data is changed', function () {
    this.dataviewModel.sync = function (method, model, options) {
      options.success({ 'response': true });
    };

    spyOn(this.view, '_unsetRange').and.callThrough();
    this.view.unsettingRange = true;
    this.dataviewModel.fetch();
    this.dataviewModel._data.reset(genHistogramData(20));
    this.dataviewModel.trigger('change:data');
    expect(this.view._unsetRange).toHaveBeenCalled();
  });

  it("shouldn't unset the range when the url is changed and is zoomed", function () {
    spyOn(this.view, '_unsetRange').and.callThrough();

    this.dataviewModel.sync = function (method, model, options) {
      options.success({ 'response': true });
    };

    this.widgetModel.set('zoomed', true);
    this.dataviewModel.fetch();

    expect(this.view._unsetRange).not.toHaveBeenCalled();

    this.view.unsettingRange = true;
    this.dataviewModel.set('url', 'test');

    expect(this.view._unsetRange).not.toHaveBeenCalled();
  });

  it('should update the stats when the model is changed', function () {
    this.dataviewModel.sync = function (method, model, options) {
      options.success({ 'response': true });
    };
    spyOn(this.dataviewModel, 'getData').and.callThrough();
    spyOn(this.view, '_updateStats').and.callThrough();
    spyOn(this.view, '_onHistogramDataChanged');
    this.dataviewModel.fetch();
    this.dataviewModel._data.reset(genHistogramData(20));
    this.dataviewModel.trigger('change:data');
    expect(this.view._onHistogramDataChanged).toHaveBeenCalled();
    expect(this.view._updateStats).toHaveBeenCalled();
    expect(this.dataviewModel.getData).toHaveBeenCalled();
  });

  it('should update the title when the model is updated', function () {
    this.view.render();
    expect(this.view.$el.html().indexOf('Howdy') !== -1).toBe(true);
    this.widgetModel.update({title: 'Cloudy'});
    this.view.render();
    expect(this.view.$el.html().indexOf('Cloudy') !== -1).toBe(true);
  });

  it('should enable and disable filters on the dataviewModel when zooming in and out', function () {
    var histogramData = {
      'bin_width': 10,
      'bins_count': 2,
      'bins_start': 1,
      'nulls': 0,
      'bins': []
    };

    this.dataviewModel.sync = function (method, model, options) {
      options.success(histogramData);
    };

    this.dataviewModel.fetch();

    expect(this.dataviewModel.get('start')).toEqual(1);
    expect(this.dataviewModel.get('end')).toEqual(21);
    expect(this.dataviewModel.get('bins')).toEqual(2);

    spyOn(this.dataviewModel, 'enableFilter');

    // Click ZOOM
    this.view.$el.find('.js-zoom').click();

    expect(this.dataviewModel.enableFilter).toHaveBeenCalled();

    spyOn(this.dataviewModel, 'disableFilter');

    // Click CLEAR
    this.view.$el.find('.js-clear').click();

    expect(this.dataviewModel.disableFilter).toHaveBeenCalled();
  });

  it('should replace histogram chart data with dataview model data when unsets range', function () {
    spyOn(this.dataviewModel, 'getData').and.returnValue(['0', '1']);
    this.view.render();
    spyOn(this.view._originalData, 'toJSON');
    spyOn(this.view.histogramChartView, 'replaceData');
    this.view._unsetRange();
    expect(this.view.histogramChartView.replaceData).toHaveBeenCalled();
    expect(this.dataviewModel.getData).toHaveBeenCalled();
    expect(this.view._originalData.toJSON).not.toHaveBeenCalled();
  });

  it('should replace the data of the histogramChartView when user zooms in', function () {
    var i = 0;
    this.dataviewModel.sync = function (method, model, options) {
      options.success({
        'bin_width': 10,
        'bins_count': 2,
        'bins_start': i++,
        'nulls': 0,
        'bins': []
      });
    };

    this.dataviewModel.fetch();

    spyOn(this.view.histogramChartView, 'replaceData');

    // Click ZOOM
    this.view.$el.find('.js-zoom').click();

    expect(this.view.histogramChartView.replaceData).toHaveBeenCalled();
  });

  it('should update the stats values', function () {
    expect(this.widgetModel.get('min')).toBe(undefined);
    expect(this.widgetModel.get('max')).toBe(undefined);
    expect(this.widgetModel.get('avg')).toBe(undefined);
    expect(this.widgetModel.get('total')).toBe(undefined);

    this.dataviewModel._data.reset(genHistogramData(20));
    this.dataviewModel.trigger('change:data');

    expect(this.widgetModel.get('min')).not.toBe(0);
    expect(this.widgetModel.get('max')).not.toBe(0);
    expect(this.widgetModel.get('avg')).not.toBe(0);
    expect(this.widgetModel.get('total')).not.toBe(0);
  });

  it('should show stats when show_stats is true', function () {
    expect(this.view.$('.CDB-Widget-info').length).toBe(0);
    this.widgetModel.set('show_stats', true);
    this.view.render();
    expect(this.view.$('.CDB-Widget-info').length).toBe(1);
  });

  it('should update data and original data of the mini histogram if there is a bins change and it is not zoomed', function () {
    var i = 0;
    this.dataviewModel.sync = function (method, model, options) {
      options.success({
        'bin_width': 10,
        'bins_count': 2,
        'bins_start': i++,
        'nulls': 0,
        'bins': []
      });
    };

    this.dataviewModel.fetch();

    spyOn(this.view._originalData, 'reset');
    spyOn(this.view, '_isZoomed').and.returnValue(false);
    spyOn(this.view.miniHistogramChartView, 'replaceData');
    // Change data
    this.dataviewModel.update({bins: 10});
    expect(this.view.miniHistogramChartView.replaceData).toHaveBeenCalled();
    expect(this.view._originalData.reset).toHaveBeenCalled();
  });

  it('should remove previous filter if there is a bins change', function () {
    var i = 0;
    this.dataviewModel.sync = function (method, model, options) {
      options.success({
        'bin_width': 10,
        'bins_count': 2,
        'bins_start': i++,
        'nulls': 0,
        'bins': []
      });
    };

    this.dataviewModel.fetch();

    spyOn(this.dataviewModel, 'disableFilter');
    spyOn(this.view.filter, 'unsetRange');
    // Change data
    this.dataviewModel.update({bins: 10});
    expect(this.dataviewModel.disableFilter).toHaveBeenCalled();
    expect(this.view.filter.unsetRange).toHaveBeenCalled();
    expect(this.view.model.get('filter_enabled')).toBeFalsy();
    expect(this.view.model.get('lo_index')).toBeFalsy();
    expect(this.view.model.get('hi_index')).toBeFalsy();
  });

  afterEach(function () {
    this.view.clean();
  });
});

function genHistogramData (n) {
  n = n || 1;
  var arr = [];
  _.times(n, function (i) {
    var start = (100 * i) + Math.round(Math.random() * 1000);
    var end = start + 100;
    var obj = {
      bin: i,
      freq: Math.round(Math.random() * 10),
      avg: Math.round(Math.random() * 10),
      start: start,
      end: end,
      max: end,
      min: start
    };
    arr.push(obj);
  });
  return arr;
}
