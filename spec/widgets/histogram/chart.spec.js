var _ = require('underscore');
var $ = require('jquery');
var cdb = require('cartodb.js');
var d3 = require('d3');
var WidgetHistogramChart = require('../../../src/widgets/histogram/chart');

describe('widgets/histogram/chart', function () {
  var onWindowResizeReal;
  var onWindowResizeSpy;

  afterEach(function () {
    $('.js-chart').remove();
  });

  beforeEach(function () {
    d3.select('body').append('svg').attr('class', 'js-chart');

    this.width = 300;
    this.height = 100;

    d3.select($('.js-chart')[0])
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('class', 'Canvas');

    this.data = genHistogramData(20);
    this.margin = {
      top: 4,
      right: 4,
      bottom: 4,
      left: 4
    };

    this.originalData = genHistogramData(20);
    this.originalModel = new cdb.core.Model({
      data: this.originalData,
      start: this.originalData[0].start,
      end: this.originalData[this.originalData.length - 1].end,
      bins: 20
    });
    this.originalModel.getData = function () {
      return this.originalData;
    }.bind(this);

    // override default behavior of debounce, to be able to control callback
    onWindowResizeSpy = jasmine.createSpy('_onWindowResize');
    spyOn(_, 'debounce').and.callFake(function (cb) {
      onWindowResizeReal = cb;
      return onWindowResizeSpy;
    });

    this.widgetModel = new cdb.core.Model({
      style: {
        auto_style: {
          definition: {
            point: {
              color: {
                attribute: 'whatever',
                range: ['#FABADA', '#F00000', '#000000']
              }
            }
          }
        }
      }
    });

    this.widgetModel.getWidgetColor = function () { return ''; };
    this.widgetModel.getAutoStyle = function () { return this.attributes.style.auto_style; };
    this.widgetModel.isAutoStyleEnabled = function () { return true; };
    this.widgetModel.isAutoStyle = function () { return false; };

    spyOn(WidgetHistogramChart.prototype, '_refreshBarsColor').and.callThrough();
    spyOn(WidgetHistogramChart.prototype, '_setupFillColor').and.callThrough();

    this.view = new WidgetHistogramChart(({
      el: $('.js-chart'),
      margin: this.margin,
      chartBarColor: '#9DE0AD',
      hasHandles: true,
      height: 100,
      data: this.data,
      originalData: this.originalModel,
      displayShadowBars: true,
      widgetModel: this.widgetModel,
      xAxisTickFormat: function (d, i) {
        return d;
      }
    }));

    var parentSpy = jasmine.createSpyObj('view.$el.parent()', ['width']);
    parentSpy.width.and.returnValue(this.width);
    spyOn(this.view.$el, 'parent');
    this.view.$el.parent.and.returnValue(parentSpy);

    spyOn(this.view, 'refresh').and.callThrough();

    this.view.render();
  });

  it('should be hidden initially', function () {
    expect(this.view.$el.attr('style')).toMatch('none');
  });

  describe('_setupFillColor', function () {
    it('should setup the fill color initially', function () {
      expect(WidgetHistogramChart.prototype._setupFillColor).toHaveBeenCalled();
      expect(this.view._autoStyleColorsScale).not.toBeUndefined();
    });

    it('should not set autoStyleColorsScale function if auto-style is disabled', function () {
      spyOn(this.widgetModel, 'isAutoStyleEnabled').and.returnValue(false);

      var view = new WidgetHistogramChart(({
        el: $('.js-chart'),
        margin: this.margin,
        chartBarColor: '#9DE0AD',
        hasHandles: true,
        height: 100,
        data: this.data,
        originalData: this.originalModel,
        displayShadowBars: true,
        widgetModel: this.widgetModel,
        xAxisTickFormat: function (d, i) {
          return d;
        }
      }));

      expect(view._autoStyleColorsScale).toBeUndefined();
    });
  });

  describe('normalize', function () {
    it('should normalize', function () {
      spyOn(this.view, 'updateYScale');
      this.view.setNormalized(true);
      expect(this.view.model.get('normalized')).toEqual(true);
      expect(this.view.updateYScale).toHaveBeenCalled();
      expect(this.view.refresh).toHaveBeenCalled();
    });
    it('should denormalize', function () {
      spyOn(this.view, 'updateYScale');
      this.view.setNormalized(false);
      expect(this.view.model.get('normalized')).toEqual(false);
      expect(this.view.updateYScale).toHaveBeenCalled();
      expect(this.view.refresh).toHaveBeenCalled();
    });
  });

  describe('shadow bars', function () {
    it('should not show shadow bars', function () {
      this.view.options.displayShadowBars = false;
      this.view.model.set('show_shadow_bars', false);
      expect(this.view.$('.CDB-Chart-shadowBars').length).toBe(0);
      this.originalModel.trigger('change:data');
      expect(this.view.$('.CDB-Chart-shadowBars').length).toBe(0);
      this.view.showShadowBars();
      expect(this.view.$('.CDB-Chart-shadowBars').length).toBe(0);
    });

    it('should remove and generate shadow bars when original data chagnes', function () {
      spyOn(this.view, '_removeShadowBars');
      spyOn(this.view, '_generateShadowBars');
      this.originalModel.trigger('change:data');
      expect(this.view._removeShadowBars).toHaveBeenCalled();
      expect(this.view._generateShadowBars).toHaveBeenCalled();
    });
  });

  describe('when view is resized but set to not be shown just yet', function () {
    beforeEach(function () {
      expect(this.view.options.showOnWidthChange).toBe(true); // assert default value, in case it's changed
      this.view.options.showOnWidthChange = false;
    });

    it('should not show view', function () {
      expect(this.view.$el.attr('style')).toMatch('none');
    });
  });

  describe('when view is resized', function () {
    beforeEach(function () {
      onWindowResizeReal.call(this);
      expect(this.view.$el.parent).toHaveBeenCalled();
    });

    it('should render the view', function () {
      expect(this.view.$el.attr('style')).not.toMatch('none');
    });

    it('should calculate the width of the bars', function () {
      expect(this.view.barWidth).toBe((this.width - this.margin.left - this.margin.right) / this.data.length);
    });

    it('should draw the bars', function () {
      expect(this.view.$el.find('.CDB-Chart-bar').size()).toBe(this.data.length);
    });

    it('should draw the axis', function () {
      expect(this.view.$el.find('.CDB-Chart-axis').size()).toBe(1);
    });

    it('should draw the handles', function () {
      expect(this.view.$el.find('.CDB-Chart-handle').size()).toBe(2);
    });

    it('should hide the chart', function () {
      expect(this.view.$el.css('display')).toBe('inline');

      this.view.hide();

      expect(this.view.isHidden()).toBe(true);
      expect(this.view.model.get('display')).toBe(false);
      expect(this.view.$el.css('display')).toBe('none');
    });

    it('should show the chart', function () {
      this.view.hide();
      this.view.show();
      expect(this.view.$el.css('display')).toBe('inline');
    });

    it('should set the parent width', function () {
      this.view.show();
      this.view._resizeToParentElement();
      expect(this.view.model.get('width')).toBe(this.width);
    });

    it('should generate the shadow bars', function () {
      expect(this.view.$el.find('.CDB-Chart-shadowBars').length).toBe(1);
    });

    it('should hide the shadow bars', function () {
      this.view.removeShadowBars();
      expect(this.view.$el.find('.CDB-Chart-shadowBars').length).toBe(0);
    });

    it('should maintain the visibility after calling _resizeToParentElement', function () {
      this.view.show();
      this.view.$el.parent().width();
      this.view._resizeToParentElement();
      expect(this.view.$el.css('display')).toBe('inline');
      expect(this.view.model.get('display')).toBe(true);

      this.view.hide();
      this.view._resizeToParentElement();
      expect(this.view.$el.css('display')).toBe('none');
      expect(this.view.model.get('display')).toBe(false);
    });

    it('should calculate the scales', function () {
      expect(this.view.xScale(0)).toBe(0);
      expect(this.view.xScale(100)).toMatch(/\d+/);
      expect(this.view.xScale(100)).toEqual(this.view.chartWidth());
      expect(this.view.yScale(0)).toMatch(/\d+/);
      expect(this.view.yScale(0)).toEqual(this.view.chartHeight());
    });

    it('should refresh the data', function () {
      this.view.show();
      this.view.model.set({ data: genHistogramData(20) });
      expect(this.view.refresh).toHaveBeenCalled();
    });

    describe('should allow to manage the y scale', function () {
      beforeEach(function () {
        this.originalScale = this.view.yScale;
        this.view.model.set('data', genHistogramData(10));
      });

      it('should calculate the y scale on request', function () {
        expect(this.view.yScale).toEqual(this.originalScale);

        this.view.updateYScale();
        expect(this.view.yScale).not.toEqual(this.originalScale);
      });

      it('should restore the y scale on request', function () {
        this.view.resetYScale();
        expect(this.view.yScale).toEqual(this.originalScale);
      });
    });
  });

  describe('._getDataForScales', function () {
    it('should calculate (x|y)Scale depending originalData if it is provided and view is not bounded', function () {
      var data = this.view._getDataForScales();
      expect(data).toBe(this.originalData);
      expect(data).not.toBe(this.data);
    });

    it('should calculate (x|y)Scale depending current data if view is bounded', function () {
      this.view.model.set('bounded', true);
      var data = this.view._getDataForScales();
      expect(data).not.toBe(this.originalData);
      expect(data).toBe(this.data);
    });

    it('should calculate (x|y)Scale depending current data if originalData is not defined', function () {
      delete this.view._originalData;
      var data = this.view._getDataForScales();
      expect(data).not.toBe(this.originalData);
      expect(data).toBe(this.data);
    });
  });

  describe('autostyle changes', function () {
    beforeEach(function () {
      this.widgetModel.set('autoStyle', true);
    });

    it('should trigger a refresh of the bars fill color', function () {
      expect(WidgetHistogramChart.prototype._refreshBarsColor).toHaveBeenCalled();
    });
  });

  describe('style changes', function () {
    beforeEach(function () {
      WidgetHistogramChart.prototype._setupFillColor.calls.reset();
      WidgetHistogramChart.prototype._refreshBarsColor.calls.reset();
      this.widgetModel.set('style', {});
    });

    it('should trigger a refresh of the bars fill color', function () {
      expect(WidgetHistogramChart.prototype._refreshBarsColor.calls.count()).toEqual(1);
    });

    it('should setup the colors scale', function () {
      expect(WidgetHistogramChart.prototype._setupFillColor.calls.count()).toEqual(1);
    });
  });

  describe('color bar', function () {
    it('should be green by default', function () {
      expect(this.view.$('.CDB-Chart-bar').attr('fill')).toEqual('#9DE0AD');
    });

    it('should be custom if widget color is different', function () {
      spyOn(this.widgetModel, 'getWidgetColor').and.returnValue('red');
      this.view._refreshBarsColor();
      expect(this.view.$('.CDB-Chart-bar').attr('fill')).toEqual('red');
    });

    it('should be colored by autostyle range colors when autostyle is applied', function () {
      spyOn(this.widgetModel, 'isAutoStyle').and.returnValue(true);
      this.widgetModel.set({
        style: {
          auto_style: {
            definition: {
              point: {
                color: {
                  attribute: 'whatever',
                  range: ['red', 'blue', 'green']
                }
              }
            }
          }
        }
      });

      this.view.$('.CDB-Chart-bar').each(function (i, el) {
        expect($(el).attr('fill')).not.toEqual('#9DE0AD');
      });

      var dataSize = this.view.model.get('data').length;
      _.times(dataSize, function (i) {
        var color;
        if (i < 6) {
          color = 'red';
        } else if (i > 5 && i < 13) {
          color = 'blue';
        } else {
          color = 'green';
        }

        expect(this.view.$('.CDB-Chart-bar:eq(' + i + ')').attr('fill')).toEqual(color);
      }, this);
    });
  });
});

function genHistogramData (n) {
  n = n || 1;
  var arr = [];
  _.times(n, function (i) {
    var start = i;
    var end = i + 1;
    var obj = {
      bin: i,
      freq: Math.round(Math.random() * 10),
      start: start,
      end: end,
      max: end,
      min: start
    };
    arr.push(obj);
  });
  return arr;
}
