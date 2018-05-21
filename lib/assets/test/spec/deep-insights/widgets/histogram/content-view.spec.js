var _ = require('underscore');
var specHelper = require('../../spec-helper');
var HistogramContentView = require('../../../../../javascripts/deep-insights/widgets/histogram/content-view');
var HistogramWidgetModel = require('../../../../../javascripts/deep-insights/widgets/histogram/histogram-widget-model');
var HistogramChartView = require('../../../../../javascripts/deep-insights/widgets/histogram/chart');

describe('widgets/histogram/content-view', function () {
  var nodeId = 'a0';

  function getNumberOfListeners (listeners) {
    return _.chain(listeners)
      .pluck('count')
      .reduce(function (memo, num) {
        return memo + num;
      }, 0)
      .value();
  }

  function createView (options) {
    options = options || {};
    var vis = specHelper.createDefaultVis();
    this.layerModel = vis.map.layers.first();
    this.layerModel.set('layer_name', '< & ><h1>Hello</h1>');
    var source = vis.analysis.findNodeById(nodeId);
    this.dataviewModel = vis.dataviews.createHistogramModel({
      id: 'widget_3',
      column: 'col',
      column_type: 'number',
      source: source
    });

    this.originalData = this.dataviewModel.getUnfilteredDataModel();
    this.originalData.set({
      data: [{ bin: 10, max: 0 }, { bin: 3, max: 10 }],
      start: 0,
      end: 256,
      bins: 2
    });
    if (options.originalDataFetched) {
      this.originalData.set('hasBeenFetched', true, { silent: true });
    }

    this.widgetModel = new HistogramWidgetModel({
      title: 'Howdy',
      attrsNames: ['title']
    }, {
      dataviewModel: this.dataviewModel,
      layerModel: this.layerModel
    });

    var oldFtech = this.dataviewModel.fetch;
    var widgetModel = this.widgetModel;
    this.dataviewModel.fetch = function (options) {
      oldFtech.call(this, options);
      widgetModel.attributes.hasInitialState = true;
      options && options.complete && options.complete();
    };

    spyOn(this.dataviewModel, 'getData').and.returnValue(['0', '1']);
    spyOn(this.dataviewModel, 'fetch').and.callThrough();

    if (options.spyPrototype) {
      spyOn(HistogramChartView.prototype, '_setupFillColor').and.returnValue('red');
      spyOn(HistogramContentView.prototype, 'render').and.callThrough();
      spyOn(HistogramContentView.prototype, '_onNormalizedChanged').and.callThrough();
    }

    this.view = new HistogramContentView({
      model: this.widgetModel,
      dataviewModel: this.dataviewModel
    });
  }

  beforeEach(function () {
    createView.call(this, { spyPrototype: true });
  });

  describe('when originalData', function () {
    it('is not loaded should call _initBinds when hasBeenFetched changes the first time', function () {
      spyOn(this.view, '_initBinds');

      this.originalData.trigger('change:hasBeenFetched', true);

      expect(this.view._initBinds).toHaveBeenCalled();
    });

    it('is loaded should call _initBinds immediately', function () {
      createView.call(this, {
        originalDataFetched: true,
        spyPrototype: false
      });

      // If _initBinds has been called, then we're listening at least to 3 events.
      expect(getNumberOfListeners(this.view._listeningTo)).toBeGreaterThan(2);
    });
  });

  describe('update stats', function () {
    it('should update the stats values', function () {
      expect(this.widgetModel.get('min')).toBe(undefined);
      expect(this.widgetModel.get('max')).toBe(undefined);
      expect(this.widgetModel.get('avg')).toBe(undefined);
      expect(this.widgetModel.get('total')).toBe(undefined);

      this.dataviewModel.getData.and.returnValue(JSON.stringify(genHistogramData(20)));
      this.dataviewModel.trigger('change:data');

      expect(this.widgetModel.get('min')).not.toBe(0);
      expect(this.widgetModel.get('max')).not.toBe(0);
      expect(this.widgetModel.get('avg')).not.toBe(0);
      expect(this.widgetModel.get('total')).not.toBe(0);
    });
  });

  describe('when originalData is loaded', function () {
    beforeEach(function () {
      this.originalData.trigger('change:data', this.originalData);
      this.originalData.trigger('change:hasBeenFetched', true);
      this.view.model.set('hasInitialState', true);
    });

    describe('when collapsed is true', function () {
      describe('render', function () {
        it('should hide the content', function () {
          pending('Fix the DOM children leak');
          expect(this.view.$('.CDB-Widget-content').length).toBe(1);
          this.widgetModel.set('collapsed', true);
          expect(this.view.$('.CDB-Widget-content').length).toBe(0);
        });
      });
    });

    describe('when show_stats is true', function () {
      describe('render', function () {
        it('should show stats', function () {
          expect(this.view.$('.CDB-Widget-info').length).toBe(0);
          this.widgetModel.set('show_stats', true);
          this.view.render();
          expect(this.view.$('.CDB-Widget-info').length).toBe(1);
        });
      });
    });

    describe('when nulls is not defined in dataview', function () {
      describe('.render', function () {
        it('should hide nulls', function () {
          spyOn(this.view._dataviewModel, 'hasNulls').and.returnValue(false);
          this.widgetModel.set('show_stats', true);
          this.view.render();
          expect(this.view.$('.js-nulls').length).toBe(0);
        });
      });
    });

    describe('when show_source is true', function () {
      var tableName = 'table_name';
      var sourceType = 'sampling';
      var layerName = 'Test Layer Name';

      beforeEach(function () {
        this.widgetModel.set({
          show_source: true,
          table_name: tableName
        });
      });

      describe('when dataViewModel is sourceType', function () {
        describe('.render', function () {
          it('should render properly', function () {
            this.view.render();

            expect(this.view.$el.html()).toContain(nodeId);
            expect(this.view.$el.html()).toContain('Source');
            expect(this.view.$el.html()).toContain(tableName);
          });
        });
      });

      describe('when dataViewModel is not sourceType', function () {
        beforeEach(function () {
          spyOn(this.dataviewModel, 'getSourceType').and.returnValue(sourceType);
          spyOn(this.dataviewModel, 'isSourceType').and.returnValue(false);
          this.layerModel.set('layer_name', layerName, { silent: true });
        });

        describe('.render', function () {
          it('should render properly', function () {
            this.view.render();

            expect(this.view.$('.CDB-IconFont-ray').length).toBe(1);
            expect(this.view.$el.html()).toContain(nodeId);
            expect(this.view.$el.html()).toContain('Subsample');
            expect(this.view.$el.html()).toContain(layerName);
          });
        });
      });
    });

    describe('.initBinds', function () {
      beforeEach(function () {
        createView.call(this, { spyPrototype: false });
        this.originalData.trigger('change:hasBeenFetched', true);
      });

      it('should render the widget when the layer name changes', function () {
        this.layerModel.set('layer_name', 'Hello');
        expect(this.view.render).toHaveBeenCalled();
      });

      it('should render the widget normalized changes', function () {
        this.view.render();
        this.widgetModel.set('normalized', !this.widgetModel.get('normalized'));
        expect(this.view._onNormalizedChanged).toHaveBeenCalled();
      });
    });

    it('should revert the lockedByUser state when the model is changed', function () {
      spyOn(this.view, '_unsetRange').and.callThrough();

      this.dataviewModel.sync = function (method, model, options) {
        options.success({
          'bin_width': 10,
          'bins_count': 2,
          'bins_start': 1,
          'nulls': 0,
          'bins': []
        });
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
        options.success({
          'bin_width': 10,
          'bins_count': 2,
          'bins_start': 1,
          'nulls': 0,
          'bins': []
        });
      };
      this.view.lockedByUser = true;
      this.dataviewModel.fetch();

      this.dataviewModel.trigger('change:data');

      expect(this.view.lockedByUser).toBe(false);
    });

    it('should unset the range when the data is changed', function () {
      this.dataviewModel.sync = function (method, model, options) {
        options.success({
          'bin_width': 10,
          'bins_count': 2,
          'bins_start': 1,
          'nulls': 0,
          'bins': []
        });
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
        options.success({
          'bin_width': 10,
          'bins_count': 2,
          'bins_start': 1,
          'nulls': 0,
          'bins': []
        });
      };

      this.widgetModel.set('zoomed', true);
      this.dataviewModel.fetch();

      expect(this.view._unsetRange).not.toHaveBeenCalled();

      this.view.unsettingRange = true;
      this.dataviewModel.set('url', 'test');

      expect(this.view._unsetRange).not.toHaveBeenCalled();
    });

    it('should update the stats when the data of the model has changed', function () {
      spyOn(this.view, '_updateStats').and.callThrough();
      this.dataviewModel._data.reset(genHistogramData(20));
      this.dataviewModel.trigger('change:data');
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
      this.dataviewModel.sync = function (method, model, options) {
        options.success({
          'bin_width': 10,
          'bins_count': 2,
          'bins_start': 1,
          'nulls': 0,
          'bins': []
        });
      };
      this.dataviewModel.fetch();
      spyOn(this.dataviewModel, 'enableFilter');
      this.view.$('.js-zoom').click();
      expect(this.dataviewModel.enableFilter).toHaveBeenCalled();
      spyOn(this.dataviewModel, 'disableFilter');
      this.view.$('.js-clear').click();
      expect(this.dataviewModel.disableFilter).toHaveBeenCalled();
    });

    it('should set and unset bounds for the histogram view when chart is zoomed in and zoomed out', function () {
      this.dataviewModel.sync = function (method, model, options) {
        options.success({
          'bin_width': 10,
          'bins_count': 2,
          'bins_start': 1,
          'nulls': 0,
          'bins': []
        });
      };
      this.dataviewModel.fetch();
      spyOn(this.view.histogramChartView, 'setBounds');
      spyOn(this.view.histogramChartView, 'unsetBounds');
      this.view.$('.js-zoom').click();
      expect(this.view.histogramChartView.setBounds).toHaveBeenCalled();
      this.view.$('.js-clear').click();
      expect(this.view.histogramChartView.unsetBounds).toHaveBeenCalled();
    });

    it('should replace histogram chart data with dataview model data when unsets range', function () {
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
          'bins': [{ bin: 0 }, { bin: 1 }]
        });
      };

      spyOn(this.view, '_onChangeZoomed').and.callThrough();
      this.view.render();

      spyOn(this.view.histogramChartView, 'replaceData');
      this.view.$('.js-zoom').click();
      expect(this.view._onChangeZoomed).toHaveBeenCalled();
      expect(this.view.histogramChartView.replaceData).toHaveBeenCalled();
    });

    it('should update data and original data of the mini histogram if there is a data change and it is not zoomed', function () {
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

      spyOn(this.view, '_isZoomed').and.returnValue(false);
      spyOn(this.view.miniHistogramChartView, 'replaceData');
      // Change data
      this.originalData.trigger('loadModelCompleted', null, this.originalData);
      expect(this.view.miniHistogramChartView.replaceData).toHaveBeenCalled();
    });

    it('should remove previous filter if there is a data change', function () {
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
      this.originalData.set('bins', 122, { silent: true });
      this.originalData.trigger('loadModelCompleted', null, this.originalData);
      expect(this.dataviewModel.disableFilter).toHaveBeenCalled();
      expect(this.view.filter.unsetRange).toHaveBeenCalled();
      expect(this.view.model.get('filter_enabled')).toBeFalsy();
      expect(this.view.model.get('lo_index')).toBeFalsy();
      expect(this.view.model.get('hi_index')).toBeFalsy();
    });

    it('should reset widget if number of bins is changed', function () {
      this.view._unbinds();
      spyOn(this.view, '_resetWidget');
      this.view._setupBindings();
      var prevBins = this.view._dataviewModel.get('bins') || 10;

      this.view._dataviewModel.set('bins', prevBins + 1);

      expect(this.view._resetWidget).toHaveBeenCalled();
    });
  });

  describe('_onNormalizedChanged', function () {
    it('should set normalized in histogram and miniHistogram views to our value', function () {
      this.originalData.trigger('change:hasBeenFetched', true);
      this.view.render();
      var prevNormalized = this.view.model.get('normalized');
      spyOn(this.view.histogramChartView, 'setNormalized');
      spyOn(this.view.miniHistogramChartView, 'setNormalized');

      this.view.model.set('normalized', !prevNormalized);

      expect(this.view.histogramChartView.setNormalized).toHaveBeenCalledWith(!prevNormalized);
      expect(this.view.miniHistogramChartView.setNormalized).toHaveBeenCalledWith(!prevNormalized);
    });
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
