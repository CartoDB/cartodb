var _ = require('underscore');
var $ = require('jquery');
var d3 = require('d3');
var WidgetHistogramChart = require('cdb/geo/ui/widgets/histogram/chart');

describe('geo/ui/widgets/histogram/chart', function() {
  var onWindowResizeReal;
  var onWindowResizeSpy;

  afterEach(function() {
    $('.js-chart').remove();
  });

  beforeEach(function() {
    d3.select("body").append("svg").attr('class', 'js-chart');

    this.width = 300;
    this.height = 100;

    d3.select($('.js-chart')[0])
    .attr('width',  this.width)
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

    // override default behavior of debounce, to be able to control callback
    onWindowResizeSpy = jasmine.createSpy('_onWindowResize');
    spyOn(_, 'debounce').and.callFake(function(cb) {
      onWindowResizeReal = cb;
      return onWindowResizeSpy;
    });

    this.view = new WidgetHistogramChart(({
      el: $('.js-chart'),
      margin: this.margin,
      handles: true,
      height: 100,
      data: this.data,
      xAxisTickFormat: function(d, i) {
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

  it('should be hidden initially', function() {
    expect(this.view.$el.attr('style')).toMatch('none');
  });

  describe('when view is resized but set to not be shown just yet', function() {
    beforeEach(function() {
      expect(this.view.options.showOnWidthChange).toBe(true); // assert default value, in case it's changed
      this.view.options.showOnWidthChange = false;
    });

    it('should not show view', function() {
      expect(this.view.$el.attr('style')).toMatch('none');
    });
  });

  describe('when view is resized', function() {
    beforeEach(function() {
      onWindowResizeReal.call(this);
      expect(this.view.$el.parent).toHaveBeenCalled();
    });

    it('should render the view', function() {
      expect(this.view.$el.attr('style')).not.toMatch('none');
    });

    it('should calculate the width of the bars', function() {
      expect(this.view.barWidth).toBe((this.width - this.margin.left - this.margin.right) / this.data.length);
    });

    it('should draw the bars', function() {
      expect(this.view.$el.find('.Bar').size()).toBe(this.data.length);
    });

    it('should draw the axis', function() {
      expect(this.view.$el.find('.Axis').size()).toBe(1);
    });

    it('should draw the handles', function() {
      expect(this.view.$el.find('.Handle').size()).toBe(2);
    });

    it('should calculate the scales', function() {
      var chartWidth = this.width - this.margin.left - this.margin.right;
      var chartHeight = this.height - this.margin.top - this.margin.bottom;
      var max = _.max(this.view.model.get('data'), function(d) { return d.freq; });

      expect(this.view.xScale(0)).toBe(0);
      expect(this.view.xScale(100)).toBe(chartWidth);

      expect(this.view.yScale(0)).toBe(chartHeight);
      expect(this.view.yScale(max.freq)).toBe(0);
    });

    it('should refresh the data', function() {
      this.view.show();
      this.view.model.set({ data: genHistogramData(20) });
      expect(this.view.refresh).toHaveBeenCalled();
    });
  });
});

function genHistogramData(n) {
  n = n || 1;
  var arr = [];
  _.times(n, function(i) {
    var start = (100 * i) + Math.round(Math.random() * 1000);
    var end = start + 100;
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
