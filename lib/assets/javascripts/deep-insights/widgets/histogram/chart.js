var $ = require('jquery');
var _ = require('underscore');
var d3 = require('d3');
var d3Interpolate = require('d3-interpolate');
var CoreModel = require('backbone/core-model');
var CoreView = require('backbone/core-view');
var formatter = require('../../formatter');
var timestampHelper = require('../../util/timestamp-helper');
var viewportUtils = require('../../viewport-utils');

var FILTERED_COLOR = '#2E3C43';
var UNFILTERED_COLOR = 'rgba(0, 0, 0, 0.06)';
var TIP_RECT_HEIGHT = 17;
var TIP_H_PADDING = 6;
var TRIANGLE_SIDE = 14;
var TRIANGLE_HEIGHT = 7;
// How much lower (based on height) will the triangle be on the right side
var TRIANGLE_RIGHT_FACTOR = 1.3;
var TOOLTIP_MARGIN = 2;
var DASH_WIDTH = 2;
var MOBILE_BAR_HEIGHT = 3;

var BEZIER_MARGIN_X = 0.1;
var BEZIER_MARGIN_Y = 1;

var trianglePath = function (x1, y1, x2, y2, x3, y3, yFactor) {
  // Bezier Control point y
  var cy = y3 + (yFactor * BEZIER_MARGIN_Y);
  // Bezier Control point x 1
  var cx1 = x3 + BEZIER_MARGIN_X;
  var cx2 = x3 - BEZIER_MARGIN_X;
  return 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2 + ' C ' + cx1 + ' ' + cy + ' ' + cx2 + ' ' + cy + ' ' + x1 + ' ' + y1 + ' z';
};

module.exports = CoreView.extend({
  options: {
    // render the chart once the width is set as default, provide false value for this prop to disable this behavior
    // e.g. for "mini" histogram behavior
    showOnWidthChange: true,
    chartBarColor: '#F2CC8F',
    labelsMargin: 16, // px
    hasAxisTip: false,
    minimumBarHeight: 2,
    animationSpeed: 750,
    handleWidth: 8,
    handleRadius: 3,
    divisionWidth: 80,
    animationBarDelay: function (d, i) {
      return Math.random() * (100 + (i * 10));
    },
    transitionType: 'elastic'
  },

  initialize: function () {
    this._originalData = this.options.originalData;

    if (!_.isNumber(this.options.height)) throw new Error('height is required');
    if (!this.options.dataviewModel) throw new Error('dataviewModel is required');
    if (!this.options.layerModel) throw new Error('layerModel is required');
    if (!this.options.type) throw new Error('type is required');

    _.bindAll(this, '_selectBars', '_adjustBrushHandles', '_onBrushMove', '_onBrushEnd', '_onMouseMove', '_onMouseOut');

    // Use this special setup for each view instance ot have its own debounced listener
    // TODO in theory there's the possiblity that the callback is called before the view is rendered in the DOM,
    //  which would lead to the view not being visible until an explicit window resize.
    //  a wasAddedToDOM event would've been nice to have
    this.forceResize = _.debounce(this._resizeToParentElement.bind(this), 50);

    // using tagName: 'svg' doesn't work,
    // and w/o class="" d3 won't instantiate properly
    this.setElement($('<svg class=""></svg>')[0]);

    this._widgetModel = this.options.widgetModel;
    this._dataviewModel = this.options.dataviewModel;
    this._layerModel = this.options.layerModel;

    this.canvas = d3.select(this.el)
      .style('overflow', 'visible')
      .attr('width', 0)
      .attr('height', this.options.height);

    this.canvas
      .append('g')
      .attr('class', 'CDB-WidgetCanvas');

    this._setupModel();
    this._setupBindings();
    this._setupDimensions();
    this._setupD3Bindings();
    this._setupFillColor();

    this.hide(); // will be toggled on width change

    this._tooltipFormatter = formatter.formatNumber; // Tooltips are always numbers
    this._createFormatter();
  },

  render: function () {
    this._generateChart();
    this._generateChartContent();
    return this;
  },

  replaceData: function (data) {
    this.model.set({ data: data });
  },

  toggleLabels: function (show) {
    this.model.set('showLabels', show);
  },

  chartWidth: function () {
    var margin = this.model.get('margin');

    // Get max because width might be negative initially
    return Math.max(0, this.model.get('width') - margin.left - margin.right);
  },

  chartHeight: function () {
    var m = this.model.get('margin');
    var labelsMargin = this.model.get('showLabels')
      ? this.options.labelsMargin
      : 0;

    return this.model.get('height') - m.top - m.bottom - labelsMargin;
  },

  getSelectionExtent: function () {
    if (this.brush && this.brush.extent()) {
      var extent = this.brush.extent();

      return extent[1] - extent[0];
    }

    return 0;
  },

  _resizeToParentElement: function () {
    if (this.$el.parent()) {
      // Hide this view temporarily to get actual size of the parent container
      var wasHidden = this.isHidden();

      this.hide();

      var parent = this.$el.parent();
      var grandParent = parent.parent && parent.parent() && parent.parent().length > 0
        ? parent.parent()
        : null;
      var width = parent.width() || 0;

      if (this.model.get('animated')) {
        // We could just substract 24, width of play/pause but imho this is more future proof
        this.$el.siblings().each(function () {
          width -= $(this).width();
        });
      }

      if (grandParent && grandParent.outerWidth && this._isTabletViewport()) {
        width -= grandParent.outerWidth(true) - grandParent.width();
      }

      if (wasHidden) {
        this.hide();
      } else {
        this.show();
      }

      this.model.set('width', width);
    }
  },

  _onChangeLeftAxisTip: function () {
    this._updateAxisTip('left');
  },

  _onChangeRightAxisTip: function () {
    this._updateAxisTip('right');
  },

  _overlap: function (first, second) {
    var bFirst = first.node().getBoundingClientRect();
    var bSecond = second.node().getBoundingClientRect();

    return !(bFirst.right < bSecond.left ||
    bFirst.left > bSecond.right ||
    bFirst.bottom < bSecond.top ||
    bFirst.top > bSecond.bottom);
  },

  _updateTriangle: function (isRight, triangle, start, center, rectWidth) {
    var ySign = isRight && !(this._isTabletViewport() && this._isTimeSeries()) ? -1 : 1;

    var transform = d3.transform(triangle.attr('transform'));
    var side = Math.min(TRIANGLE_SIDE, rectWidth);
    var translate = center - (side / 2);

    var offset = isRight
      ? Math.min((start + rectWidth) - (translate + side), 0)
      : Math.abs(Math.min(translate - start, 0));

    var p0 = [0, 0];
    var p1 = [side, 0];
    var p2 = [side / 2 - offset, TRIANGLE_HEIGHT * ySign];

    triangle.attr('d', trianglePath(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], ySign));
    transform.translate[0] = center - (side / 2) + offset;

    triangle.attr('transform', transform.toString());
  },

  _updateAxisTip: function (className) {
    var leftTip = 'left_axis_tip';
    var rightTip = 'right_axis_tip';
    var attr = className + '_axis_tip';
    var isRight = className === 'right';
    var isLeft = !isRight;
    var isWeek = this._dataviewModel.get('aggregation') === 'week';
    var model = this.model.get(attr);
    if (model === undefined) { return; }

    var leftValue = this.model.get(leftTip);
    var rightValue = this.model.get(rightTip);

    var textLabel = this.chart.select('.CDB-Chart-axisTipText.CDB-Chart-axisTip-' + className);
    var axisTip = this.chart.select('.CDB-Chart-axisTip.CDB-Chart-axisTip-' + className);
    var rectLabel = this.chart.select('.CDB-Chart-axisTipRect.CDB-Chart-axisTip-' + className);
    var handle = this.chart.select('.CDB-Chart-handle.CDB-Chart-handle-' + className);
    var triangle = handle.select('.CDB-Chart-axisTipTriangle');

    textLabel.data([model]).text(function (d) {
      var text = this.formatter(d);

      this._dataviewModel.trigger('on_update_axis_tip', {
        attr: attr,
        text: text
      });

      return text;
    }.bind(this));

    if (!textLabel.node()) {
      return;
    }

    var textBBox = textLabel.node().getBBox();
    var width = textBBox.width;
    var rectWidth = width + TIP_H_PADDING;
    var handleWidth = this.options.handleWidth;
    var barWidth = this.barWidth;
    var chartWidth = this.chartWidth();

    rectLabel.attr('width', rectWidth);
    textLabel.attr('dx', TIP_H_PADDING / 2);
    textLabel.attr('dy', textBBox.height - Math.abs((textBBox.height - TIP_RECT_HEIGHT) / 2));

    var parts = d3.transform(handle.attr('transform')).translate;
    var xPos = +parts[0] + (this.options.handleWidth / 2);

    var yPos = isRight && !(this._isMobileViewport() && this._isTimeSeries())
      ? this.chartHeight() + (TRIANGLE_HEIGHT * TRIANGLE_RIGHT_FACTOR) - 1
      : -(TRIANGLE_HEIGHT + TIP_RECT_HEIGHT + TOOLTIP_MARGIN);
    yPos = Math.floor(yPos);

    // Align rect and bar centers
    var rectCenter = rectWidth / 2;
    var barCenter = (handleWidth + barWidth) / 2;
    barCenter -= (isRight ? barWidth : 0); // right tip should center to the previous bin
    if (!this._isDateTimeSeries() || isWeek) { // In numeric and week histograms, axis should point to the handler
      barCenter = handleWidth / 2;
    }
    var translate = barCenter - rectCenter;

    // Check if rect if out of bounds and clip translate if that happens
    var leftPos = xPos + translate;
    var rightPos = leftPos + rectWidth;
    var translatedCenter = translate + rectCenter;
    var rightExceed = rightPos - (chartWidth + handleWidth);

    // Do we exceed left?
    if (leftPos < 0) {
      translate -= leftPos;
    }

    // Do we exceed right?
    if (rightExceed > 0) {
      translate -= rightExceed;
    }

    // Show / hide labels depending on their values
    var showTip = isLeft
      ? leftValue <= rightValue
      : (leftValue <= rightValue && !(leftValue === rightValue && this._isDateTimeSeries()));

    this._showAxisTip(className, showTip);

    // Translate axis tip
    axisTip.attr('transform', 'translate(' + translate + ', ' + yPos + ')');

    // Update triangle position
    this._updateTriangle(isRight, triangle, translate, translatedCenter, rectWidth);

    if (this.model.get('dragging') && this._isMobileViewport() && this._isTimeSeries()) {
      this._showAxisTip(className, true);
    }
  },

  _onChangeData: function () {
    if (this.model.previous('data').length !== this.model.get('data').length) {
      this.reset();
    } else {
      this.refresh();
    }

    this._setupFillColor();
    this._refreshBarsColor();
  },

  _onChangeRange: function () {
    var loIndex = this.model.get('lo_index');
    var hiIndex = this.model.get('hi_index');
    if ((loIndex === 0 && hiIndex === 0) || (loIndex === null && hiIndex === null)) {
      return;
    }

    this.selectRange(loIndex, hiIndex);
    this._adjustBrushHandles();
    this._setAxisTipAccordingToBins();
    this._selectBars();
    this.trigger('on_brush_end', loIndex, hiIndex);
  },

  _onChangeWidth: function () {
    var width = this.model.get('width');
    this.canvas.attr('width', width);
    this.chart.attr('width', width);
    if (this.options.showOnWidthChange && width > 0) {
      this.show();
    }
    this.reset();

    var loBarIndex = this.model.get('lo_index');
    var hiBarIndex = this.model.get('hi_index');
    this.selectRange(loBarIndex, hiBarIndex);
    this._updateAxisTip('left');
    this._updateAxisTip('right');
  },

  _onChangeNormalized: function () {
    // do not show shadow bars if they are not enabled
    this.model.set('show_shadow_bars', !this.model.get('normalized'));
    this._generateShadowBars();
    this.updateYScale();
    this.refresh();
  },

  _onChangeHeight: function () {
    var height = this.model.get('height');

    this.$el.height(height);
    this.chart.attr('height', height);
    this.leftHandle.attr('height', height);
    this.rightHandle.attr('height', height);
    this.updateYScale();

    this.reset();
  },

  _onChangeShowLabels: function () {
    this._axis.style('opacity', this.model.get('showLabels') ? 1 : 0);
  },

  _onChangePos: function () {
    var pos = this.model.get('pos');
    var margin = this.model.get('margin');

    var x = +pos.x;
    var y = +pos.y;

    this.chart
      .transition()
      .duration(150)
      .attr('transform', 'translate(' + (margin.left + x) + ', ' + (margin.top + y) + ')');
  },

  _onChangeDragging: function () {
    this.chart.classed('is-dragging', this.model.get('dragging'));

    if (!this.model.get('dragging') && this._isMobileViewport() && this._isTimeSeries()) {
      this._showAxisTip('right', false);
      this._showAxisTip('left', false);
    }
  },

  _toggleAxisTip: function (className, show) {
    var textLabel = this.chart.select('.CDB-Chart-axisTipText.CDB-Chart-axisTip-' + className);
    var rectLabel = this.chart.select('.CDB-Chart-axisTipRect.CDB-Chart-axisTip-' + className);
    var handle = this.chart.select('.CDB-Chart-handle.CDB-Chart-handle-' + className);
    var triangle = handle.select('.CDB-Chart-axisTipTriangle');
    var duration = 60;

    if (textLabel) {
      textLabel.transition().duration(duration).attr('opacity', show);
    }
    if (rectLabel) {
      rectLabel.transition().duration(duration).attr('opacity', show);
    }
    if (triangle) {
      triangle.transition().duration(duration).style('opacity', show);
    }
  },

  _showAxisTip: function (className, show) {
    this._toggleAxisTip(className, show ? 1 : 0);
  },

  _setAxisTipAccordingToBins: function () {
    var left = this._getValueFromBinIndex(this._getLoBarIndex());
    var right = this._getValueFromBinIndex(this._getHiBarIndex());
    if (this._isDateTimeSeries()) {
      right = timestampHelper.substractOneUnit(right, this._dataviewModel.get('aggregation'));
    }
    this._setAxisTip(left, right);
  },

  _setAxisTip: function (left, right) {
    if (this.options.hasAxisTip) {
      this.model.set({
        left_axis_tip: left,
        right_axis_tip: right
      });
    }
  },

  reset: function () {
    this._removeChartContent();
    this._setupDimensions();
    this._calcBarWidth();
    this._generateChartContent();
    this._generateShadowBars();
  },

  refresh: function () {
    this._createFormatter();
    this._setupDimensions();
    this._removeAxis();
    this._generateAxis();
    this._updateChart();
    this._refreshBarsColor();

    this.chart.select('.CDB-Chart-handles').moveToFront();
    this.chart.select('.Brush').moveToFront();
  },

  resetIndexes: function () {
    this.model.set({ lo_index: null, hi_index: null });
  },

  removeShadowBars: function () {
    this.model.set('show_shadow_bars', false);
  },

  _removeShadowBars: function () {
    this.chart.selectAll('.CDB-Chart-shadowBars').remove();
  },

  _removeBars: function () {
    this.chart.selectAll('.CDB-Chart-bars').remove();
  },

  _removeBrush: function () {
    this.chart.selectAll('.Brush').remove();
    this.chart.classed('is-selectable', false);
    this._axis.classed('is-disabled', false);
  },

  _removeLines: function () {
    this.chart.select('.CDB-Chart-lines').remove();
    this.chart.select('.CDB-Chart-line--bottom').remove();
  },

  _removeChartContent: function () {
    this._removeBrush();
    this._removeHandles();
    this._removeBars();
    this._removeAxis();
    this._removeLines();
  },

  _generateChartContent: function () {
    this._generateAxis();

    if (!(this._isTabletViewport() && this._isTimeSeries())) {
      this._generateLines();
    }

    this._generateBars();

    if (!(this._isMobileViewport() && this._isTimeSeries())) {
      this._generateBottomLine();
    }

    this._generateHandles();
    this._setupBrush();
  },

  _generateLines: function () {
    this._generateHorizontalLines();
    this._generateVerticalLines();
  },

  _generateVerticalLines: function () {
    var lines = this.chart.select('.CDB-Chart-lines');

    lines.append('g')
      .selectAll('.CDB-Chart-line')
      .data(this.verticalRange.slice(1, this.verticalRange.length - 1))
      .enter().append('svg:line')
      .attr('class', 'CDB-Chart-line')
      .attr('y1', 0)
      .attr('x1', function (d) { return d; })
      .attr('y2', this.chartHeight())
      .attr('x2', function (d) { return d; });
  },

  _generateHorizontalLines: function () {
    var lines = this.chart.append('g')
      .attr('class', 'CDB-Chart-lines');

    lines.append('g')
      .attr('class', 'y')
      .selectAll('.CDB-Chart-line')
      .data(this.horizontalRange.slice(0, this.horizontalRange.length - 1))
      .enter().append('svg:line')
      .attr('class', 'CDB-Chart-line')
      .attr('x1', 0)
      .attr('y1', function (d) { return d; })
      .attr('x2', this.chartWidth())
      .attr('y2', function (d) { return d; });
  },

  _generateBottomLine: function () {
    this.chart.append('line')
      .attr('class', 'CDB-Chart-line CDB-Chart-line--bottom')
      .attr('x1', 0)
      .attr('y1', this.chartHeight() - 1)
      .attr('x2', this.chartWidth() - 1)
      .attr('y2', this.chartHeight() - 1);
  },

  _setupD3Bindings: function () { // TODO: move to a helper
    d3.selection.prototype.moveToBack = function () {
      return this.each(function () {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
          this.parentNode.insertBefore(this, firstChild);
        }
      });
    };

    d3.selection.prototype.moveToFront = function () {
      return this.each(function () {
        this.parentNode.appendChild(this);
      });
    };
  },

  _setupModel: function () {
    this.model = new CoreModel({
      bounded: false,
      showLabels: true,
      data: this.options.data,
      height: this.options.height,
      display: true,
      show_shadow_bars: this.options.displayShadowBars,
      margin: _.clone(this.options.margin),
      width: 0, // will be set on resize listener
      pos: { x: 0, y: 0 },
      normalized: this.options.normalized,
      local_timezone: this.options.local_timezone
    });
  },

  _setupBindings: function () {
    this.listenTo(this.model, 'change:data', this._onChangeData);
    this.listenTo(this.model, 'change:display', this._onChangeDisplay);
    this.listenTo(this.model, 'change:dragging', this._onChangeDragging);
    this.listenTo(this.model, 'change:height', this._onChangeHeight);
    this.listenTo(this.model, 'change:left_axis_tip', this._onChangeLeftAxisTip);
    this.listenTo(this.model, 'change:lo_index change:hi_index', this._onChangeRange);
    this.listenTo(this.model, 'change:pos', this._onChangePos);
    this.listenTo(this.model, 'change:right_axis_tip', this._onChangeRightAxisTip);
    this.listenTo(this.model, 'change:showLabels', this._onChangeShowLabels);
    this.listenTo(this.model, 'change:show_shadow_bars', this._onChangeShowShadowBars);
    this.listenTo(this.model, 'change:width', this._onChangeWidth);
    this.listenTo(this.model, 'change:normalized', this._onChangeNormalized);

    if (this._widgetModel) {
      this.listenTo(this._widgetModel, 'change:autoStyle', this._refreshBarsColor);
      this.listenTo(this._widgetModel, 'change:style', function () {
        this._setupFillColor();
        this._refreshBarsColor();
      });
    }

    if (this._dataviewModel) {
      this.listenTo(this._dataviewModel, 'change:offset change:localTimezone', function () {
        this.refresh();
      });
    }

    this.listenTo(this._layerModel, 'change:cartocss', function () {
      if (!this._areGradientsAlreadyGenerated()) {
        this._setupFillColor();
      }
    });

    if (this._originalData) {
      this.listenTo(this._originalData, 'change:data', function () {
        this.updateYScale();
        this._removeShadowBars();
        this._generateShadowBars();
      });
    }
  },

  _setupDimensions: function () {
    this._setupScales();
    this._setupRanges();
    this.forceResize();
  },

  _getData: function () {
    return (this._originalData && this._originalData.getData()) || this.model.get('data');
  },

  _getMaxData: function (data) {
    return d3.max(data, function (d) { return _.isEmpty(d) ? 0 : d.freq; });
  },

  _getXScale: function () {
    return d3.scale.linear().domain([0, 100]).range([0, this.chartWidth()]);
  },

  _getYScale: function () {
    var data = this.model.get('normalized') ? this.model.get('data') : this._getData();
    return d3.scale.linear().domain([0, this._getMaxData(data)]).range([this.chartHeight(), 0]);
  },

  updateXScale: function () {
    this.xScale = this._getXScale();
  },

  updateYScale: function () {
    this.yScale = this._getYScale();
  },

  resetYScale: function () {
    this.yScale = this._originalYScale;
  },

  _getDataForScales: function () {
    if (!this.model.get('bounded') && this._originalData) {
      return this._originalData.getData();
    } else {
      return this.model.get('data');
    }
  },

  _setupScales: function () {
    var data = this._getDataForScales();
    this.updateXScale();

    if (!this._originalYScale || this.model.get('normalized')) {
      this._originalYScale = this.yScale = this._getYScale();
    }

    if (!data || !data.length) {
      return;
    }

    var start = data[0].start;
    var end = data[data.length - 1].end;

    this.xAxisScale = d3.scale.linear().range([start, end]).domain([0, this.chartWidth()]);
  },

  _setupRanges: function () {
    this.verticalRange = this._calculateVerticalRangeDivisions();
    this.horizontalRange = d3.range(0, this.chartHeight() + this.chartHeight() / 2, this.chartHeight() / 2);
  },

  _calculateVerticalRangeDivisions: function () {
    if (this._isDateTimeSeries() && this.model.get('data').length > 0) {
      return this._calculateTimelySpacedDivisions();
    }
    return this._calculateEvenlySpacedDivisions();
  },

  _calculateTimelySpacedDivisions: function () {
    this._calcBarWidth();
    var divisions = Math.round(this.chartWidth() / this.options.divisionWidth);
    var bucketsPerDivision = Math.ceil(this.model.get('data').length / divisions);
    var range = [0];
    var index = 0;

    for (var i = 0; i < divisions; i++) {
      index = (i < (divisions - 1)) ? index + bucketsPerDivision : this.model.get('data').length;
      range.push(Math.ceil(this.xAxisScale.invert(this._getValueFromBinIndex(index))));
    }

    range = _.uniq(range);

    // Sometimes the last two ticks are too close. In those cases, we get rid of the second to last
    if (range.length >= 3) {
      var lastTwo = _.last(range, 2);
      if ((lastTwo[1] - lastTwo[0]) < this.options.divisionWidth) {
        range = _.without(range, lastTwo[0]);
      }
    }

    return range;
  },

  _calculateEvenlySpacedDivisions: function () {
    var divisions = Math.round(this.chartWidth() / this.options.divisionWidth);
    var step = this.chartWidth() / divisions;
    var stop = this.chartWidth() + step;
    var range = d3.range(0, stop, step).slice(0, divisions + 1);
    return range;
  },

  _calcBarWidth: function () {
    this.barWidth = this.chartWidth() / this.model.get('data').length;
  },

  _generateChart: function () {
    var margin = this.model.get('margin');

    this.chart = d3.select(this.el)
      .selectAll('.CDB-WidgetCanvas')
      .append('g')
      .attr('class', 'CDB-Chart')
      .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    this.chart.classed(this.options.className || '', true);
  },

  _onChangeShowShadowBars: function () {
    if (this.model.get('show_shadow_bars')) {
      this._generateShadowBars();
    } else {
      this._removeShadowBars();
    }
  },

  _onChangeDisplay: function () {
    if (this.model.get('display')) {
      this._show();
    } else {
      this._hide();
    }
  },

  hide: function () {
    this.model.set('display', false);
  },

  show: function () {
    this.model.set('display', true);
  },

  _hide: function () {
    this.$el.hide();
  },

  _show: function () {
    this.$el.show();
  },

  isHidden: function () {
    return !this.model.get('display');
  },

  _selectBars: function () {
    this.chart
      .selectAll('.CDB-Chart-bar')
      .classed({
        'is-selected': function (d, i) {
          return this._isBarChartWithinFilter(i);
        }.bind(this),
        'is-filtered': function (d, i) {
          return !this._isBarChartWithinFilter(i);
        }.bind(this)
      });
  },

  _isBarChartWithinFilter: function (i) {
    var extent = this.brush.extent();
    var lo = extent[0];
    var hi = extent[1];
    var a = Math.floor(i * this.barWidth);
    var b = Math.floor(a + this.barWidth);
    var LO = Math.floor(this.xScale(lo));
    var HI = Math.floor(this.xScale(hi));

    return (a > LO && a < HI) || (b > LO && b < HI) || (a <= LO && b >= HI);
  },

  _isDragging: function () {
    return this.model.get('dragging');
  },

  setAnimated: function () {
    return this.model.set('animated', true);
  },

  _isAnimated: function () {
    return this.model.get('animated');
  },

  _move: function (pos) {
    this.model.set({ pos: pos });
  },

  expand: function (height) {
    this.canvas.attr('height', this.model.get('height') + height);
    this._move({ x: 0, y: height });
  },

  contract: function (height) {
    this.canvas.attr('height', height);
    this._move({ x: 0, y: 0 });
  },

  resizeHeight: function (height) {
    this.model.set('height', height);
  },

  setNormalized: function (normalized) {
    this.model.set('normalized', !!normalized);
    return this;
  },

  removeSelection: function () {
    this.resetIndexes();
    this.chart.selectAll('.CDB-Chart-bar').classed({'is-selected': false, 'is-filtered': false});
    this._refreshBarsColor();
    this._removeBrush();
    this._setupBrush();
  },

  selectRange: function (loBarIndex, hiBarIndex) {
    if (!loBarIndex && !hiBarIndex) {
      return;
    }

    // -- HACK: Reset filter if any of the indexes is out of the scope
    var data = this._dataviewModel.get('data');
    if (!data[loBarIndex] || !data[hiBarIndex - 1]) {
      return this.trigger('on_reset_filter');
    }

    var loPosition = this._getBarPosition(loBarIndex);
    var hiPosition = this._getBarPosition(hiBarIndex);

    this.model.set({ lo_index: loBarIndex, hi_index: hiBarIndex });
    this._selectRange(loPosition, hiPosition);
  },

  _selectRange: function (loPosition, hiPosition) {
    this.chart.select('.Brush').transition()
      .duration(this.brush.empty() ? 0 : 150)
      .call(this.brush.extent([loPosition, hiPosition]))
      .call(this.brush.event);
  },

  _getLoBarIndex: function () {
    var extent = this.brush.extent();
    return Math.round(this.xScale(extent[0]) / this.barWidth);
  },

  _getHiBarIndex: function () {
    var extent = this.brush.extent();
    return Math.round(this.xScale(extent[1]) / this.barWidth);
  },

  _getBarIndex: function () {
    var x = d3.event.sourceEvent.layerX;
    return Math.floor(x / this.barWidth);
  },

  _getBarPosition: function (index) {
    var data = this.model.get('data');
    return index * (100 / data.length);
  },

  _setupBrush: function () {
    // define brush control element and its events
    var brush = d3.svg.brush()
      .x(this.xScale)
      .on('brush', this._onBrushMove)
      .on('brushend', this._onBrushEnd);

    // create svg group with class brush and call brush on it
    var brushg = this.chart.append('g')
      .attr('class', 'Brush')
      .call(brush);

    var height = this._isTabletViewport() && this._isTimeSeries() ? this.chartHeight() * 2 : this.chartHeight();
    // set brush extent to rect and define objects height
    brushg.selectAll('rect')
      .attr('y', 0)
      .attr('height', height);

    // Only bind on the background element
    brushg.selectAll('rect.background')
      .on('mouseout', this._onMouseOut)
      .on('mousemove', this._onMouseMove);

    // Prevent scroll while touching selections
    brushg.selectAll('rect')
      .classed('ps-prevent-touchmove', true);
    brushg.selectAll('g')
      .classed('ps-prevent-touchmove', true);

    this.brush = brush;

    // Make grabby handles as big as the display handles
    this.chart.selectAll('g.resize rect')
      .attr('width', this.options.handleWidth)
      .attr('x', -this.options.handleWidth / 2);
  },

  _onBrushMove: function () {
    if (!this.brush.empty()) {
      this.chart.classed('is-selectable', true);
      this._axis.classed('is-disabled', true);
      this.model.set({ dragging: true });
      this._selectBars();
      this._setupFillColor();
      this._refreshBarsColor();
      this._adjustBrushHandles();
      this._updateAxisTip('left');
      this._updateAxisTip('right');
    }
  },

  _onBrushEnd: function () {
    var data = this.model.get('data');
    var brush = this.brush;
    var loPosition, hiPosition;

    var loBarIndex = this._getLoBarIndex();
    var hiBarIndex = this._getHiBarIndex();

    this.model.set({ dragging: false });

    // click in animated histogram
    if (brush.empty() && this._isAnimated()) {
      // Send 0..1 factor of position of click in graph
      this.trigger('on_brush_click', brush.extent()[0] / 100);

      return;
    } else {
      loPosition = this._getBarPosition(loBarIndex);
      hiPosition = this._getBarPosition(hiBarIndex);

      // for some reason d3 launches several brushend events
      if (!d3.event.sourceEvent) {
        return;
      }

      // click in first and last indexes
      if (loBarIndex === hiBarIndex) {
        if (hiBarIndex >= data.length) {
          loBarIndex = data.length - 1;
          hiBarIndex = data.length;
        } else {
          hiBarIndex = hiBarIndex + 1;
        }
      }

      this.model.set({ lo_index: loBarIndex, hi_index: hiBarIndex }, { silent: true });
      // Maybe the indexes don't change, and the handlers end up stuck in the middle of the
      // bucket because the event doesn't trigger, so let's trigger it manually
      this.model.trigger('change:lo_index');
    }

    // click in non animated histogram
    if (d3.event.sourceEvent && loPosition === undefined && hiPosition === undefined) {
      var barIndex = this._getBarIndex();
      this.model.set({ lo_index: barIndex, hi_index: barIndex + 1 });
    }

    this._setupFillColor();
    this._refreshBarsColor();
  },

  _onMouseOut: function () {
    var bars = this.chart.selectAll('.CDB-Chart-bar');

    bars
      .classed('is-highlighted', false)
      .attr('fill', this._getFillColor.bind(this));

    this.trigger('hover', { target: null });
  },

  _onMouseMove: function () {
    var x = d3.event.offsetX - this.model.get('margin').left;

    var barIndex = Math.floor(x / this.barWidth);
    var data = this.model.get('data');

    if (data[barIndex] === undefined || data[barIndex] === null) {
      return;
    }

    var freq = data[barIndex].freq;
    var hoverProperties = {};

    var bar = this.chart.select('.CDB-Chart-bar:nth-child(' + (barIndex + 1) + ')');

    if (bar && bar.node() && !bar.classed('is-selected')) {
      var left = (barIndex * this.barWidth) + (this.barWidth / 2);
      var top = this.yScale(freq);
      var h = this.chartHeight() - this.yScale(freq);

      if (h < this.options.minimumBarHeight && h > 0) {
        top = this.chartHeight() - this.options.minimumBarHeight;
      }

      if (!this._isDragging() && freq > 0) {
        var d = this.formatter(freq);
        hoverProperties = { target: bar[0][0], top: top, left: left, data: d };
      } else {
        hoverProperties = null;
      }
    } else {
      hoverProperties = null;
    }

    this.trigger('hover', hoverProperties);

    this.chart.selectAll('.CDB-Chart-bar')
      .classed('is-highlighted', false)
      .attr('fill', this._getFillColor.bind(this));

    if (bar && bar.node()) {
      bar.attr('fill', function () {
        return this._getHoverFillColor(data[barIndex], barIndex);
      }.bind(this));
      bar.classed('is-highlighted', true);
    }
  },

  _adjustBrushHandles: function () {
    var extent = this.brush.extent();

    var loExtent = extent[0];
    var hiExtent = extent[1];

    this._moveHandle(loExtent, 'left');
    this._moveHandle(hiExtent, 'right');

    this._setAxisTipAccordingToBins();
  },

  _moveHandle: function (position, selector) {
    var handle = this.chart.select('.CDB-Chart-handle-' + selector);
    var fixedPosition = position.toFixed(5);
    var x = this.xScale(fixedPosition) - this.options.handleWidth / 2;
    var display = (fixedPosition >= 0 && fixedPosition <= 100) ? 'inline' : 'none';

    handle
      .style('display', display)
      .attr('transform', 'translate(' + x + ', 0)');
  },

  _generateAxisTip: function (className) {
    var handle = this.chart.select('.CDB-Chart-handle.CDB-Chart-handle-' + className);

    var yPos = className === 'right' && !(this._isMobileViewport() && this._isTimeSeries())
      ? this.chartHeight() + (TRIANGLE_HEIGHT * TRIANGLE_RIGHT_FACTOR) : -(TRIANGLE_HEIGHT + TIP_RECT_HEIGHT + TOOLTIP_MARGIN);
    yPos = Math.floor(yPos);

    var yTriangle = className === 'right' && !(this._isMobileViewport() && this._isTimeSeries())
      ? this.chartHeight() + (TRIANGLE_HEIGHT * TRIANGLE_RIGHT_FACTOR) + 2 : -(TRIANGLE_HEIGHT + TOOLTIP_MARGIN) - 2;
    var yFactor = className === 'right' ? -1 : 1;
    var triangleHeight = TRIANGLE_HEIGHT * yFactor;

    var axisTip = handle.selectAll('g')
      .data([''])
      .enter().append('g')
      .attr('class', 'CDB-Chart-axisTip CDB-Chart-axisTip-' + className)
      .attr('transform', 'translate(0,' + yPos + ')');

    handle.append('path')
      .attr('class', 'CDB-Chart-axisTipRect CDB-Chart-axisTipTriangle')
      .attr('transform', 'translate(' + ((this.options.handleWidth / 2) - (TRIANGLE_SIDE / 2)) + ', ' + yTriangle + ')')
      .attr('d', trianglePath(0, 0, TRIANGLE_SIDE, 0, (TRIANGLE_SIDE / 2), triangleHeight, yFactor))
      .style('opacity', '1');

    axisTip.append('rect')
      .attr('class', 'CDB-Chart-axisTipRect CDB-Chart-axisTip-' + className)
      .attr('rx', '2')
      .attr('ry', '2')
      .attr('opacity', '1')
      .attr('height', TIP_RECT_HEIGHT);

    axisTip.append('text')
      .attr('class', 'CDB-Text CDB-Size-small CDB-Chart-axisTipText CDB-Chart-axisTip-' + className)
      .attr('dy', '11')
      .attr('dx', '0')
      .attr('opacity', '1')
      .text(function (d) { return d; });
  },

  _isTabletViewport: function () {
    return viewportUtils.isTabletViewport();
  },

  _generateHandle: function (className) {
    var height = this._isTabletViewport() && this._isTimeSeries() ? this.chartHeight() * 2 : this.chartHeight();
    var opts = { width: this.options.handleWidth, height: height, radius: this.options.handleRadius };

    var handle = this.chart.select('.CDB-Chart-handles')
      .append('g')
      .attr('class', 'CDB-Chart-handle CDB-Chart-handle-' + className);

    if (this.options.hasAxisTip) {
      this._generateAxisTip(className);
    }

    if (this.options.hasHandles) {
      handle
        .append('rect')
        .attr('class', 'CDB-Chart-handleRect')
        .attr('width', opts.width)
        .attr('height', opts.height)
        .attr('rx', opts.radius)
        .attr('ry', opts.radius);

      var y = this._isTabletViewport() && this._isTimeSeries() ? this.chartHeight() : this.chartHeight() / 2;
      y -= 3;
      var x1 = (opts.width - DASH_WIDTH) / 2;

      for (var i = 0; i < 3; i++) {
        handle
          .append('line')
          .attr('class', 'CDB-Chart-handleGrip')
          .attr('x1', x1)
          .attr('y1', y + i * 3)
          .attr('x2', x1 + DASH_WIDTH)
          .attr('y2', y + i * 3);
      }
    }

    return handle;
  },

  _generateHandles: function () {
    this.chart.append('g').attr('class', 'CDB-Chart-handles');
    this.leftHandle = this._generateHandle('left');
    this.rightHandle = this._generateHandle('right');
  },

  _removeHandles: function () {
    this.chart.select('.CDB-Chart-handles').remove();
  },

  _removeAxis: function () {
    this.canvas.select('.CDB-Chart-axis').remove();
  },

  _generateAdjustAnchorMethod: function (ticks) {
    return function (d, i) {
      if (i === 0) {
        return 'start';
      } else if (i === (ticks.length - 1)) {
        return 'end';
      } else {
        return 'middle';
      }
    };
  },

  _generateAxis: function () {
    this._axis = this._generateNumericAxis();

    this._onChangeShowLabels();
  },

  _generateNumericAxis: function () {
    var self = this;
    var adjustTextAnchor = this._generateAdjustAnchorMethod(this.verticalRange);

    var axis = this.chart.append('g')
      .attr('class', 'CDB-Chart-axis CDB-Text CDB-Size-small');

    function verticalToValue (d) {
      return self.xAxisScale
        ? self.xAxisScale(d)
        : null;
    }

    axis
      .append('g')
      .selectAll('.Label')
      .data(this.verticalRange)
      .enter().append('text')
      .attr('x', function (d) {
        return d;
      })
      .attr('y', function () { return self.chartHeight() + 15; })
      .attr('text-anchor', adjustTextAnchor)
      .text(function (d) {
        var value = verticalToValue(d);
        if (_.isFinite(value)) {
          return self.formatter(value);
        }
      });

    return axis;
  },

  _getMinValueFromBinIndex: function (binIndex) {
    var data = this.model.get('data');
    var dataBin = data[binIndex];
    if (dataBin) {
      return dataBin.min != null ? dataBin.min : dataBin.start;
    } else {
      return null;
    }
  },

  _getMaxValueFromBinIndex: function (binIndex) {
    var result = null;
    var data = this.model.get('data');
    var dataBin = data[binIndex];
    if (dataBin) {
      if (this._isDateTimeSeries() && !_.isUndefined(dataBin.next)) {
        result = dataBin.next;
      } else {
        result = dataBin.min != null ? dataBin.max : dataBin.end;
      }
    }

    return result;
  },

  _getValueFromBinIndex: function (index) {
    if (!_.isNumber(index)) {
      return null;
    }
    var result = null;
    var fromStart = true;
    var data = this.model.get('data');
    if (index >= data.length) {
      index = data.length - 1;
      fromStart = false;
    }
    var dataBin = data[index];
    if (dataBin) {
      result = fromStart ? dataBin.start : _.isFinite(dataBin.next) ? dataBin.next : dataBin.end;
    }

    return result;
  },

  _getIndexFromValue: function (value) {
    var index = _.findIndex(this.model.get('data'), function (bin) {
      return bin.start <= value && value <= bin.end;
    });
    return index;
  },

  _getMaxFromData: function () {
    return this.model.get('data').length > 0
      ? _.last(this.model.get('data')).end
      : null;
  },

  // Calculates the domain ([ min, max ]) of the selected data. If there is no selection ongoing,
  // it will take the first and last buckets with frequency.
  _calculateDataDomain: function () {
    var data = _.clone(this.model.get('data'));
    var minBin;
    var maxBin;
    var minValue;
    var maxValue;

    if (!this._hasFilterApplied()) {
      minValue = this._getMinValueFromBinIndex(0);
      maxValue = this._getMaxValueFromBinIndex(data.length - 1);

      minBin = _.find(data, function (d) {
        return d.freq !== 0;
      });

      maxBin = _.find(data.reverse(), function (d) {
        return d.freq !== 0;
      });
    } else {
      var loBarIndex = this._getLoBarIndex();
      var hiBarIndex = this._getHiBarIndex() - 1;
      var filteredData = data.slice(loBarIndex, hiBarIndex);

      if (_.isNaN(loBarIndex) || _.isNaN(hiBarIndex)) {
        return [0, 0];
      }

      minValue = this._getMinValueFromBinIndex(loBarIndex);
      maxValue = this._getMaxValueFromBinIndex(hiBarIndex);

      if (data[loBarIndex] && data[loBarIndex].freq === 0) {
        minBin = _.find(filteredData, function (d) {
          return d.freq !== 0;
        }, this);
      }

      if (data[hiBarIndex] && data[hiBarIndex].freq === 0) {
        var reversedData = filteredData.reverse();
        maxBin = _.find(reversedData, function (d) {
          return d.freq !== 0;
        }, this);
      }
    }

    minValue = minBin ? (minBin.min != null ? minBin.min : minBin.start) : minValue;
    maxValue = maxBin ? (maxBin.max != null ? maxBin.max : maxBin.end) : maxValue;

    return [minValue, maxValue];
  },

  _removeFillGradients: function () {
    var defs = d3.select(this.el).select('defs');
    defs.remove();
    delete this._linearGradients;
  },

  _areGradientsAlreadyGenerated: function () {
    return !!this._linearGradients;
  },

  // Generate a linear-gradient with several stops for each bar
  // in order to generate the proper colors ramp. It will depend
  // of the domain of the selected data.
  _generateFillGradients: function () {
    if (!this._widgetModel || !this._widgetModel.isAutoStyleEnabled()) {
      return false;
    }

    var obj = this._widgetModel.getAutoStyle();

    if (_.isEmpty(obj) || _.isEmpty(obj.definition)) {
      return false;
    }

    var self = this;
    var geometryDefinition = obj.definition[Object.keys(obj.definition)[0]]; // Gets first definition by geometry
    var colorsRange = geometryDefinition && geometryDefinition.color && geometryDefinition.color.range;
    var interpolatedColors = d3Interpolate.interpolateRgbBasis(colorsRange);
    var colorsRangeHover = _.map(colorsRange, function (color) {
      return d3.rgb(color).darker(0.3).toString();
    });
    var interpolatedHoverColors = d3Interpolate.interpolateRgbBasis(colorsRangeHover);
    var data = this.model.get('data');
    var domain = this._calculateDataDomain();
    var domainScale = d3.scale.linear().domain(domain).range([0, 1]);
    var defs = d3.select(this.el).append('defs');
    var stopsNumber = 4; // It is not necessary to create as many stops as colors

    this._linearGradients = defs
      .selectAll('.gradient')
      .data(data)
      .enter()
      .append('linearGradient')
      .attr('class', 'gradient')
      .attr('id', function (d, i) {
        // This is the scale for each bin, used in each stop within this gradient
        this.__scale__ = d3.scale.linear()
          .range([ self._getMinValueFromBinIndex(i), self._getMaxValueFromBinIndex(i) ])
          .domain([0, 1]);
        return 'bar-' + self.cid + '-' + i;
      })
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    this._linearGradientsHover = defs
      .selectAll('.gradient-hover')
      .data(data)
      .enter()
      .append('linearGradient')
      .attr('class', 'gradient-hover')
      .attr('id', function (d, i) {
        // This is the scale for each bin, used in each stop within this gradient
        this.__scale__ = d3.scale.linear()
          .range([self._getMinValueFromBinIndex(i), self._getMaxValueFromBinIndex(i)])
          .domain([0, 1]);
        return 'bar-' + self.cid + '-' + i + '-hover';
      })
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    this._linearGradients
      .selectAll('stop')
      .data(d3.range(stopsNumber + 1))
      .enter()
      .append('stop')
      .attr('offset', function (d, i) {
        var offset = this.__offset__ = Math.floor(((i) / stopsNumber) * 100);
        return (offset + '%');
      })
      .attr('stop-color', function () {
        var localScale = this.parentNode.__scale__;
        var interpolateValue = domainScale(localScale(this.__offset__ / 100));
        return interpolatedColors(interpolateValue);
      });

    this._linearGradientsHover
      .selectAll('stop')
      .data(d3.range(stopsNumber + 1))
      .enter()
      .append('stop')
      .attr('offset', function (d, i) {
        var offset = this.__offset__ = Math.floor(((i) / stopsNumber) * 100);
        return (offset + '%');
      })
      .attr('stop-color', function () {
        var localScale = this.parentNode.__scale__;
        var interpolateValue = domainScale(localScale(this.__offset__ / 100));
        return interpolatedHoverColors(interpolateValue);
      });
  },

  _setupFillColor: function () {
    this._removeFillGradients();
    this._generateFillGradients();
  },

  _getFillColor: function (d, i) {
    if (this._widgetModel) {
      if (this._widgetModel.isAutoStyle()) {
        if (this._hasFilterApplied()) {
          if (!this._isBarChartWithinFilter(i)) {
            return UNFILTERED_COLOR;
          }
        }

        return 'url(#bar-' + this.cid + '-' + i + ')';
      } else {
        if (this._hasFilterApplied()) {
          if (this._isBarChartWithinFilter(i)) {
            return FILTERED_COLOR;
          } else {
            return UNFILTERED_COLOR;
          }
        }

        return this._widgetModel.getWidgetColor() || this.options.chartBarColor;
      }
    }

    return this.options.chartBarColor;
  },

  _getHoverFillColor: function (d, i) {
    var currentFillColor = this._getFillColor(d, i);

    if (this._widgetModel) {
      if (this._widgetModel.isAutoStyle()) {
        return 'url(#bar-' + this.cid + '-' + i + '-hover)';
      }
    }

    return d3.rgb(currentFillColor).darker(0.3).toString();
  },

  _updateChart: function () {
    var self = this;
    var data = this.model.get('data');

    var bars = this.chart.selectAll('.CDB-Chart-bar')
      .data(data);

    bars
      .enter()
      .append('rect')
      .attr('class', 'CDB-Chart-bar')
      .attr('fill', this._getFillColor.bind(this))
      .attr('x', function (d, i) {
        return i * self.barWidth;
      })
      .attr('y', self.chartHeight())
      .attr('height', 0)
      .attr('width', Math.max(0, this.barWidth - 1));

    bars
      .attr('data-tooltip', function (d) {
        return self._tooltipFormatter(d.freq);
      })
      .transition()
      .duration(200)
      .attr('height', function (d) {
        if (_.isEmpty(d)) {
          return 0;
        }

        if (self._isMobileViewport() && self._isTimeSeries()) {
          return MOBILE_BAR_HEIGHT;
        }

        var h = self.chartHeight() - self.yScale(d.freq);

        if (h < self.options.minimumBarHeight && h > 0) {
          h = self.options.minimumBarHeight;
        }
        return h;
      })
      .attr('y', function (d) {
        if (_.isEmpty(d)) {
          return self.chartHeight();
        }

        if (self._isMobileViewport() && self._isTimeSeries()) {
          return self.chartHeight() / 2 + MOBILE_BAR_HEIGHT;
        }

        var h = self.chartHeight() - self.yScale(d.freq);

        if (h < self.options.minimumBarHeight && h > 0) {
          return self.chartHeight() - self.options.minimumBarHeight;
        } else {
          return self.yScale(d.freq);
        }
      });

    bars
      .exit()
      .transition()
      .duration(200)
      .attr('height', function () {
        return 0;
      })
      .attr('y', function () {
        return self.chartHeight();
      });
  },

  _refreshBarsColor: function () {
    this.chart
      .selectAll('.CDB-Chart-bar')
      .classed('is-highlighted', false)
      .attr('fill', this._getFillColor.bind(this));
  },

  _isMobileViewport: function () {
    return viewportUtils.isMobileViewport();
  },

  _generateBars: function () {
    var self = this;
    var data = this.model.get('data');

    this._calcBarWidth();
    // Remove spacing if not enough room for the smallest case, or mobile viewport
    var spacing = ((((data.length * 2) - 1) > this.chartWidth() || this._isMobileViewport()) && this._isDateTimeSeries()) ? 0 : 1;

    var bars = this.chart.append('g')
      .attr('transform', 'translate(0, 0)')
      .attr('class', 'CDB-Chart-bars')
      .selectAll('.CDB-Chart-bar')
      .data(data);

    bars
      .enter()
      .append('rect')
      .attr('class', 'CDB-Chart-bar')
      .attr('fill', this._getFillColor.bind(self))
      .attr('x', function (d, i) {
        return i * self.barWidth;
      })
      .attr('y', self.chartHeight())
      .attr('height', 0)
      .attr('data-tooltip', function (d) {
        return self._tooltipFormatter(d.freq);
      })
      .attr('width', Math.max(1, this.barWidth - spacing));

    bars
      .attr('data-tooltip', function (d) {
        return self._tooltipFormatter(d.freq);
      })
      .transition()
      .ease(this.options.transitionType)
      .duration(this.options.animationSpeed)
      .delay(this.options.animationBarDelay)
      .transition()
      .attr('height', function (d) {
        if (_.isEmpty(d)) {
          return 0;
        }

        if (self._isMobileViewport() && self._isTimeSeries()) {
          return MOBILE_BAR_HEIGHT;
        }

        var h = self.chartHeight() - self.yScale(d.freq);
        if (h < self.options.minimumBarHeight && h > 0) {
          h = self.options.minimumBarHeight;
        }

        return h;
      })
      .attr('y', function (d) {
        if (_.isEmpty(d)) {
          return self.chartHeight();
        }

        if (self._isMobileViewport() && self._isTimeSeries()) {
          return self.chartHeight() / 2 + MOBILE_BAR_HEIGHT;
        }

        var h = self.chartHeight() - self.yScale(d.freq);

        if (h < self.options.minimumBarHeight && h > 0) {
          return self.chartHeight() - self.options.minimumBarHeight;
        } else {
          return self.yScale(d.freq);
        }
      });
  },

  showShadowBars: function () {
    if (this.options.displayShadowBars) {
      this.model.set('show_shadow_bars', true);
    }
  },

  _generateShadowBars: function () {
    var data = this._getData();

    if (!data || !data.length || !this.model.get('show_shadow_bars') || this.model.get('normalized')) {
      this._removeShadowBars();
      return;
    }

    this._removeShadowBars();

    var self = this;

    var yScale = d3.scale.linear().domain([0, this._getMaxData(data)]).range([this.chartHeight(), 0]);

    var barWidth = this.chartWidth() / data.length;

    this.chart.append('g')
      .attr('transform', 'translate(0, 0)')
      .attr('class', 'CDB-Chart-shadowBars')
      .selectAll('.CDB-Chart-shadowBar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'CDB-Chart-shadowBar')
      .attr('x', function (d, i) {
        return i * barWidth;
      })
      .attr('y', function (d) {
        if (_.isEmpty(d)) {
          return self.chartHeight();
        }

        var h = self.chartHeight() - yScale(d.freq);

        if (h < self.options.minimumBarHeight && h > 0) {
          return self.chartHeight() - self.options.minimumBarHeight;
        } else {
          return yScale(d.freq);
        }
      })
      .attr('width', Math.max(0.5, barWidth - 1))
      .attr('height', function (d) {
        if (_.isEmpty(d)) {
          return 0;
        }

        var h = self.chartHeight() - yScale(d.freq);

        if (h < self.options.minimumBarHeight && h > 0) {
          h = self.options.minimumBarHeight;
        }
        return h;
      });

    // We need to explicitly move the lines of the grid behind the shadow bars
    this.chart.selectAll('.CDB-Chart-shadowBars').moveToBack();
    this.chart.selectAll('.CDB-Chart-lines').moveToBack();
  },

  _hasFilterApplied: function () {
    return this.model.get('lo_index') != null && this.model.get('hi_index') != null;
  },

  _isTimeSeries: function () {
    return this.options.type.indexOf('time') === 0;
  },

  _isDateTimeSeries: function () {
    return this.options.type === 'time-date';
  },

  _calculateDivisionWithByAggregation: function (aggregation) {
    switch (aggregation) {
      case 'year':
        return 50;
      case 'quarter':
      case 'month':
        return 80;
      case 'week':
      case 'day':
        return 120;
      default:
        return 140;
    }
  },

  _createFormatter: function () {
    this.formatter = formatter.formatNumber;

    if (this._isDateTimeSeries()) {
      this.formatter = formatter.timestampFactory(this._dataviewModel.get('aggregation'), this._dataviewModel.getCurrentOffset());
      this.options.divisionWidth = this._calculateDivisionWithByAggregation(this._dataviewModel.get('aggregation'));
    }
  },

  unsetBounds: function () {
    this.model.set('bounded', false);
    this.updateYScale();
    this.contract(this.options.height);
    this.resetIndexes();
    this.removeSelection();
    this._setupFillColor();
  },

  setBounds: function () {
    this.model.set('bounded', true);
    this.updateYScale();
    this.expand(4);
    this.removeShadowBars();
  }
});
