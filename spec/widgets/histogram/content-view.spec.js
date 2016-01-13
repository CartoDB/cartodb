var _ = require('underscore');
var cdb = require('cartodb.js');
var HistogramContentView = require('../../../src/widgets/histogram/content-view');
var WidgetModel = require('../../../src/widgets/widget-model');

describe('widgets/histogram/content-view', function () {
  beforeEach(function () {
    var vis = cdb.createVis(document.createElement('div'), {
      layers: [{type: 'torque'}]
    });
    this.dataviewModel = vis.dataviews.createHistogramDataview(vis.map.layers.first(), {
      id: 'widget_3',
      options: {
        columns: ['cartodb_id', 'title']
      }
    });

    this.widgetModel = new WidgetModel({
      title: 'Howdy'
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

  it('should revert the lockedByUser state when the model is changed', function () {
    spyOn(this.view, '_unsetRange').and.callThrough();

    this.dataviewModel.sync = function (method, model, options) {
      options.success({ 'response': true });
    };

    this.widgetModel.set('zoomed', true);
    this.dataviewModel._fetch();

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
    this.dataviewModel._fetch();
    this.dataviewModel.trigger('change:data');
    expect(this.view.lockedByUser).toBe(false);
  });

  it('should unset the range when the data is changed', function () {
    this.dataviewModel.sync = function (method, model, options) {
      options.success({ 'response': true });
    };

    spyOn(this.view, '_unsetRange').and.callThrough();
    this.view.unsettingRange = true;
    this.dataviewModel._fetch();
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
    this.dataviewModel._fetch();

    expect(this.view._unsetRange).not.toHaveBeenCalled();

    this.view.unsettingRange = true;
    this.dataviewModel.set('url', 'test');

    expect(this.view._unsetRange).not.toHaveBeenCalled();
  });

  it('should update the stats when the model is changed', function () {
    this.dataviewModel.sync = function (method, model, options) {
      options.success({ 'response': true });
    };

    spyOn(this.view, '_updateStats').and.callThrough();
    spyOn(this.view, '_onChangeModel').and.callThrough();
    this.dataviewModel._fetch();
    this.dataviewModel._data.reset(genHistogramData(20));
    this.dataviewModel.trigger('change:data');
    expect(this.view._onChangeModel).toHaveBeenCalled();
    expect(this.view._updateStats).toHaveBeenCalled();
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
