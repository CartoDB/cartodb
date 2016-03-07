var $ = require('jquery');
var _ = require('underscore');
var d3 = require('d3');
var cdb = require('cartodb.js');
var formatter = require('../../formatter');

module.exports = cdb.core.View.extend({

  options: {
    // render the chart once the width is set as default, provide false value for this prop to disable this behavior
    // e.g. for "mini" histogram behavior
    showOnWidthChange: true,
    chartBarColorClass: '',
    labelsMargin: 16, // px
    hasAxisTip: false,
    minimumBarHeight: 2,
    animationSpeed: 750,
    handleWidth: 6,
    handleHeight: 23,
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

    _.bindAll(this, '_selectBars', '_adjustBrushHandles', '_onBrushMove', '_onBrushStart', '_onMouseMove', '_onMouseOut');

    // Use this special setup for each view instance ot have its own debounced listener
    // TODO in theory there's the possiblity that the callback is called before the view is rendered in the DOM,
    //  which would lead to the view not being visible until an explicit window resize.
    //  a wasAddedToDOM event would've been nice to have
    this._onWindowResize = _.debounce(this._resizeToParentElement.bind(this), 50);
    $(window).bind('resize', this._onWindowResize);

    // using tagName: 'svg' doesn't work,
    // and w/o class="" d3 won't instantiate properly
    this.setElement($('<svg class=""></svg>')[0]);

    this.canvas = d3.select(this.el)
      .attr('width', 0)
      .attr('height', this.options.height);

    this.canvas
      .append('g')
      .attr('class', 'CDB-WidgetCanvas');

    this._setupModel();
    this._setupBindings();
    this._setupDimensions();
    this._setupD3Bindings();

    this.hide(); // will be toggled on width change
  },

  render: function () {
    this._generateChart();
    this._generateChartContent();
    return this;
  },

  clean: function () {
    $(window).unbind('resize', this._onWindowResize);
    cdb.core.View.prototype.clean.call(this);
  },

  replaceData: function (data) {
    this.model.set({ data: data });
  },

  toggleLabels: function (show) {
    this.model.set('showLabels', show);
  },

  chartWidth: function () {
    var m = this.model.get('margin');

    // Get max because width might be negative initially
    return Math.max(0, this.model.get('width') - m.left - m.right);
  },

  chartHeight: function () {
    var m = this.model.get('margin');
    var labelsMargin = this.model.get('showLabels')
      ? this.options.labelsMargin
      : 0;

    return this.model.get('height') - m.top - m.bottom - labelsMargin;
  },

  _resizeToParentElement: function () {
    if (this.$el.parent()) {
      // Hide this view temporarily to get actual size of the parent container
      var wasHidden = this.isHidden();

      this.hide();

      var width = this.$el.parent().width() || 0;

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

  _updateAxisTip: function (className) {
    var textLabel = this.chart.select('.CDB-Chart-axisTipText.CDB-Chart-axisTip-' + className);
    var axisTip = this.chart.select('.CDB-Chart-axisTip.CDB-Chart-axisTip-' + className);
    var rectLabel = this.chart.select('.CDB-Chart-axisTipRect.CDB-Chart-axisTip-' + className);
    var handle = this.chart.select('.CDB-Chart-handle.CDB-Chart-handle-' + className);

    textLabel.data([this.model.get(className + '_axis_tip')]).text(function (d) {
      return formatter.formatNumber(d);
    });

    var width = textLabel.node().getBBox().width;
    rectLabel.attr('width', width + 4);

    var parts = /translate\(\s*([^\s,)]+), ([^\s,)]+)/.exec(handle.attr('transform'));
    var xPos = +parts[1] + 3;

    if ((xPos - width / 2) < 0) {
      axisTip.attr('transform', 'translate(0, 52)');
      textLabel.attr('dx', -xPos);
      rectLabel.attr('x', -xPos);
    } else if ((xPos + width / 2 + 2) >= this.chartWidth()) {
      axisTip.attr('transform', 'translate(0, 52)');
      textLabel.attr('dx', this.chartWidth() - (xPos + width - 2));
      rectLabel.attr('x', this.chartWidth() - (xPos + width));
    } else {
      axisTip.attr('transform', 'translate(-' + (width / 2) + ', 52)');
      rectLabel.attr('x', 0);
      textLabel.attr('dx', +2);
    }
  },

  _onChangeData: function () {
    if (this.model.previous('data').length !== this.model.get('data').length) {
      this.reset();
    } else {
      this.refresh();
    }
  },

  _onChangeRange: function () {
    if (this.model.get('lo_index') === 0 && this.model.get('hi_index') === 0) {
      return;
    }
    this.trigger('range_updated', this.model.get('lo_index'), this.model.get('hi_index'));
  },

  _onChangeWidth: function () {
    var width = this.model.get('width');
    this.$el.width(width);
    this.chart.attr('width', width);
    if (this.options.showOnWidthChange && width > 0) {
      this.show();
    }
    this.reset();

    var loBarIndex = this.model.get('lo_index');
    var hiBarIndex = this.model.get('hi_index');
    this.selectRange(loBarIndex, hiBarIndex);
  },

  _onChangeHeight: function () {
    var height = this.model.get('height');

    this.$el.height(height);
    this.chart.attr('height', height);
    this.leftHandle.attr('height', height);
    this.rightHandle.attr('height', height);

    this.reset();
  },

  _onChangShowLabels: function () {
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

  _onBrushStart: function () {
    this.chart.classed('is-selectable', true);
    this._axis.classed('is-disabled', true);
  },

  _onChangeDragging: function () {
    this.chart.classed('is-dragging', this.model.get('dragging'));
    this._updateAxisTipOpacity('right');
    this._updateAxisTipOpacity('left');
  },

  _showAxisTip: function (className) {
    var textLabel = this.chart.select('.CDB-Chart-axisTipText.CDB-Chart-axisTip-' + className);
    var rectLabel = this.chart.select('.CDB-Chart-axisTipRect.CDB-Chart-axisTip-' + className);

    if (textLabel) {
      textLabel.transition().duration(200).attr('opacity', 1);
    }
    if (rectLabel) {
      rectLabel.transition().duration(200).attr('opacity', 1);
    }
  },

  _hideAxisTip: function (className) {
    var textLabel = this.chart.select('.CDB-Chart-axisTipText.CDB-Chart-axisTip-' + className);
    var rectLabel = this.chart.select('.CDB-Chart-axisTipRect.CDB-Chart-axisTip-' + className);

    if (textLabel) {
      textLabel.transition().duration(200).attr('opacity', 0);
    }
    if (rectLabel) {
      rectLabel.transition().duration(200).attr('opacity', 0);
    }
  },

  _updateAxisTipOpacity: function (className) {
    if (this.model.get('dragging')) {
      this._showAxisTip(className);
    }
  },

  _onBrushMove: function () {
    this.model.set({ dragging: true });
    this._selectBars();
    this._adjustBrushHandles();
  },

  _onMouseOut: function () {
    var bars = this.chart.selectAll('.CDB-Chart-bar');
    bars.classed('is-highlighted', false);
    this.trigger('hover', { value: null });
  },

  _onMouseMove: function () {
    var x = d3.event.offsetX;

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
        var d = formatter.formatNumber(freq);
        hoverProperties = { top: top, left: left, data: d };
      } else {
        hoverProperties = null;
      }
    } else {
      hoverProperties = null;
    }

    this.trigger('hover', hoverProperties);

    this.chart.selectAll('.CDB-Chart-bar')
      .classed('is-highlighted', false);

    if (bar && bar.node()) {
      bar.classed('is-highlighted', true);
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
    this._setupDimensions();
    this._removeAxis();
    this._generateAxis();
    this._updateChart();

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
    this._generateLines();

    this._generateBars();
    this._generateHandles();
    this._setupBrush();
    this._generateBottomLine();
  },

  _generateLines: function () {
    this._generateHorizontalLines();

    if (this.options.type !== 'time') {
      this._generateVerticalLines();
    }
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
    this.model = new cdb.core.Model({
      showLabels: true,
      data: this.options.data,
      height: this.options.height,
      display: true,
      show_shadow_bars: this.options.displayShadowBars,
      margin: _.clone(this.options.margin),
      width: 0, // will be set on resize listener
      pos: { x: 0, y: 0 }
    });
  },

  _setupBindings: function () {
    this.model.bind('change:data', this._onChangeData, this);
    this.model.bind('change:display', this._onChangeDisplay, this);
    this.model.bind('change:dragging', this._onChangeDragging, this);
    this.model.bind('change:height', this._onChangeHeight, this);
    this.model.bind('change:left_axis_tip', this._onChangeLeftAxisTip, this);
    this.model.bind('change:lo_index change:hi_index', this._onChangeRange, this);
    this.model.bind('change:pos', this._onChangePos, this);
    this.model.bind('change:right_axis_tip', this._onChangeRightAxisTip, this);
    this.model.bind('change:showLabels', this._onChangShowLabels, this);
    this.model.bind('change:show_shadow_bars', this._onChangeShowShadowBars, this);
    this.model.bind('change:width', this._onChangeWidth, this);

    if (this._originalData) {
      this._originalData.bind('reset', function () {
        this._removeShadowBars();
        this._generateShadowBars();
      }, this);
      this.add_related_model(this._originalData);
    }
  },

  _setupDimensions: function () {
    this._setupScales();
    this._setupRanges();
    this._onWindowResize();
  },

  _getXScale: function () {
    return d3.scale.linear().domain([0, 100]).range([0, this.chartWidth()]);
  },

  _getYScale: function () {
    var data = (this._originalData && this._originalData.toJSON()) || this.model.get('data');
    return d3.scale.linear().domain([0, d3.max(data, function (d) { return _.isEmpty(d) ? 0 : d.freq; })]).range([this.chartHeight(), 0]);
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

  _setupScales: function () {
    this.updateXScale();

    if (!this._originalYScale) {
      this._originalYScale = this.yScale = this._getYScale();
    }

    var data = this.model.get('data');

    if (!data || !data.length) {
      return;
    }

    if (this.options.type === 'time') {
      this.xAxisScale = d3.time.scale().domain([data[0].start * 1000, data[data.length - 1].end * 1000]).nice().range([0, this.chartWidth()]);
    } else {
      this.xAxisScale = d3.scale.linear().range([data[0].start, data[data.length - 1].end]).domain([0, this.chartWidth()]);
    }
  },

  _setupRanges: function () {
    var n = Math.round(this.chartWidth() / this.options.divisionWidth);
    this.verticalRange = d3.range(0, this.chartWidth() + this.chartWidth() / n, this.chartWidth() / n);
    this.horizontalRange = d3.range(0, this.chartHeight() + this.chartHeight() / 2, this.chartHeight() / 2);
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
    var self = this;
    var extent = this.brush.extent();
    var lo = extent[0];
    var hi = extent[1];

    this.model.set({ lo_index: this._getLoBarIndex(), hi_index: this._getHiBarIndex() });

    this.chart.selectAll('.CDB-Chart-bar').classed('is-selected', function (d, i) {
      var a = Math.floor(i * self.barWidth);
      var b = Math.floor(a + self.barWidth);
      var LO = Math.floor(self.xScale(lo));
      var HI = Math.floor(self.xScale(hi));
      var isIn = (a > LO && a < HI) || (b > LO && b < HI) || (a <= LO && b >= HI);
      return !isIn;
    });
  },

  _isDragging: function () {
    return this.model.get('dragging');
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

  removeSelection: function () {
    this.resetIndexes();
    this.chart.selectAll('.CDB-Chart-bar').classed('is-selected', false);
    this._removeBrush();
    this._setupBrush();
  },

  selectRange: function (loBarIndex, hiBarIndex) {
    if (!loBarIndex && !hiBarIndex) {
      return;
    }

    var loPosition = this._getBarPosition(loBarIndex);
    var hiPosition = this._getBarPosition(hiBarIndex);

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
    var x = d3.event.sourceEvent.offsetX;
    return Math.floor(x / this.barWidth);
  },

  _getBarPosition: function (index) {
    var data = this.model.get('data');
    return index * (100 / data.length);
  },

  _setupBrush: function () {
    var self = this;

    var brush = this.brush = d3.svg.brush().x(this.xScale);

    function onBrushEnd () {
      var data = self.model.get('data');
      var loPosition, hiPosition;

      self.model.set({ dragging: false });

      if (brush.empty()) {
        self.chart.selectAll('.CDB-Chart-bar').classed('is-selected', false);
        d3.select(this).call(brush.extent([0, 0]));
      } else {
        var loBarIndex = self._getLoBarIndex();
        var hiBarIndex = self._getHiBarIndex();

        loPosition = self._getBarPosition(loBarIndex);
        hiPosition = self._getBarPosition(hiBarIndex);

        if (!d3.event.sourceEvent) {
          return;
        }

        if (loBarIndex === hiBarIndex) {
          if (hiBarIndex >= data.length) {
            loPosition = self._getBarPosition(loBarIndex - 1);
          } else {
            hiPosition = self._getBarPosition(hiBarIndex + 1);
          }
        }

        self._selectRange(loPosition, hiPosition);
        self.model.set({ lo_index: loBarIndex, hi_index: hiBarIndex });
        self._adjustBrushHandles();
        self._selectBars();

        self.trigger('on_brush_end', self.model.get('lo_index'), self.model.get('hi_index'));
      }

      if (d3.event.sourceEvent && loPosition === undefined && hiPosition === undefined) {
        var barIndex = self._getBarIndex();

        loPosition = self._getBarPosition(barIndex);
        hiPosition = self._getBarPosition(barIndex + 1);

        self.model.set({ lo_index: barIndex, hi_index: barIndex + 1 });
        self._selectRange(loPosition, hiPosition);
        self.trigger('on_brush_end', self.model.get('lo_index'), self.model.get('hi_index'));
      }
    }

    this.brush
      .on('brushstart', this._onBrushStart)
      .on('brush', this._onBrushMove)
      .on('brushend', onBrushEnd);

    this.chart.append('g')
      .attr('class', 'Brush')
      .call(this.brush)
      .selectAll('rect')
      .attr('y', 0)
      .attr('height', this.chartHeight())
      .on('mouseout', this._onMouseOut)
      .on('mousemove', this._onMouseMove);
  },

  _adjustBrushHandles: function () {
    var extent = this.brush.extent();

    var loExtent = extent[0];
    var hiExtent = extent[1];

    var leftX = this.xScale(loExtent) - this.options.handleWidth / 2;
    var rightX = this.xScale(hiExtent) - this.options.handleWidth / 2;

    this.chart.select('.CDB-Chart-handle-left')
      .attr('transform', 'translate(' + leftX + ', 0)');

    this.chart.select('.CDB-Chart-handle-right')
      .attr('transform', 'translate(' + rightX + ', 0)');

    if (this.options.hasAxisTip) {
      this.model.set({
        left_axis_tip: this.xAxisScale(leftX + 3),
        right_axis_tip: this.xAxisScale(rightX + 3)
      });
    }
  },

  _generateAxisTip: function (className) {
    var handle = this.chart.select('.CDB-Chart-handle.CDB-Chart-handle-' + className);

    var axisTip = handle.selectAll('g')
      .data([''])
      .enter().append('g')
      .attr('class', 'CDB-Chart-axisTip CDB-Chart-axisTip-' + className)
      .attr('transform', function (d, i) { return 'translate(0,52)'; });

    this.rectLabel = axisTip.append('rect')
      .attr('class', 'CDB-Chart-axisTipRect CDB-Chart-axisTip-' + className)
      .attr('height', 12)
      .attr('width', 10);

    this.textLabel = axisTip.append('text')
      .attr('class', 'CDB-Text CDB-Size-small CDB-Chart-axisTipText CDB-Chart-axisTip-' + className)
      .attr('dy', '11')
      .attr('dx', '0')
      .text(function (d) { return d; });
  },

  _generateHandle: function (className) {
    var opts = { width: this.options.handleWidth, height: this.options.handleHeight, radius: this.options.handleRadius };
    var yPos = (this.chartHeight() / 2) - (this.options.handleHeight / 2);

    var handle = this.chart.select('.CDB-Chart-handles')
      .append('g')
      .attr('class', 'CDB-Chart-handle CDB-Chart-handle-' + className);

    if (this.options.hasAxisTip) {
      this._generateAxisTip(className);
    }

    handle
      .append('line')
      .attr('class', 'CDB-Chart-handleLine')
      .attr('x1', 3)
      .attr('y1', -4)
      .attr('x2', 3)
      .attr('y2', this.chartHeight() + 4);

    if (this.options.hasHandles) {
      handle
        .append('rect')
        .attr('class', 'CDB-Chart-handleRect')
        .attr('transform', 'translate(0, ' + yPos + ')')
        .attr('width', opts.width)
        .attr('height', opts.height)
        .attr('rx', opts.radius)
        .attr('ry', opts.radius);

      var y = 21; // initial position of the first grip

      for (var i = 0; i < 3; i++) {
        handle
          .append('line')
          .attr('class', 'CDB-Chart-handleGrip')
          .attr('x1', 2)
          .attr('y1', y + i * 3)
          .attr('x2', 4)
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

  _generateHandleLine: function () {
    return this.chart.select('.CDB-Chart-handles').append('line')
      .attr('class', 'CDB-Chart-handleLine')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', this.chartHeight());
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
    this._axis = this.options.type === 'time'
      ? this._generateTimeAxis()
      : this._generateNumericAxis();

    this._onChangShowLabels();
  },

  _generateNumericAxis: function () {
    var self = this;
    var adjustTextAnchor = this._generateAdjustAnchorMethod(this.verticalRange);

    var axis = this.chart.append('g')
      .attr('class', 'CDB-Chart-axis CDB-Text CDB-Size-small');

    axis
      .append('g')
      .selectAll('.Label')
      .data(this.verticalRange)
      .enter().append('text')
      .attr('x', function (d) { return d; })
      .attr('y', function (d) { return self.chartHeight() + 15; })
      .attr('text-anchor', adjustTextAnchor)
      .text(function (d) {
        return formatter.formatNumber(self.xAxisScale(d));
      });

    return axis;
  },

  _generateTimeAxis: function () {
    var adjustTextAnchor = this._generateAdjustAnchorMethod(this.xAxisScale.ticks());

    var xAxis = d3.svg.axis()
      .orient('bottom')
      .tickPadding(5)
      .innerTickSize(-this.chartHeight())
      .scale(this.xAxisScale)
      .orient('bottom');

    var axis = this.canvas.append('g')
      .attr('class', 'CDB-Chart-axis CDB-Text CDB-Size-small')
      .attr('transform', 'translate(0,' + (this.chartHeight() + 5) + ')')
      .call(xAxis);

    axis.selectAll('text').style('text-anchor', adjustTextAnchor);
    axis.moveToBack();

    return axis;
  },

  _updateChart: function () {
    var self = this;
    var data = this.model.get('data');

    var bars = this.chart.selectAll('.CDB-Chart-bar')
      .data(data);

    bars
      .enter()
      .append('rect')
      .attr('class', 'CDB-Chart-bar ' + this.options.chartBarColorClass)
      .attr('data', function (d) { return _.isEmpty(d) ? 0 : d.freq; })
      .attr('transform', function (d, i) {
        return 'translate(' + (i * self.barWidth) + ', 0 )';
      })
      .attr('y', self.chartHeight())
      .attr('height', 0)
      .attr('width', Math.max(0, this.barWidth - 1));

    bars
      .transition()
      .duration(200)
      .attr('height', function (d) {
        if (_.isEmpty(d)) {
          return 0;
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
      .attr('height', function (d) {
        return 0;
      })
      .attr('y', function (d) {
        return self.chartHeight();
      });
  },

  _generateBars: function () {
    var self = this;
    var data = this.model.get('data');

    this._calcBarWidth();

    var bars = this.chart.append('g')
      .attr('transform', 'translate(0, 0)')
      .attr('class', 'CDB-Chart-bars')
      .selectAll('.CDB-Chart-bar')
      .data(data);

    bars
      .enter()
      .append('rect')
      .attr('class', 'CDB-Chart-bar ' + this.options.chartBarColorClass)
      .attr('data', function (d) { return _.isEmpty(d) ? 0 : d.freq; })
      .attr('transform', function (d, i) {
        return 'translate(' + (i * self.barWidth) + ', 0 )';
      })
      .attr('y', self.chartHeight())
      .attr('height', 0)
      .attr('width', Math.max(0, this.barWidth - 1));

    bars
      .transition()
      .ease(this.options.transitionType)
      .duration(this.options.animationSpeed)
      .delay(this.options.animationBarDelay)
      .transition()
      .attr('height', function (d) {
        if (_.isEmpty(d)) {
          return 0;
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

        var h = self.chartHeight() - self.yScale(d.freq);

        if (h < self.options.minimumBarHeight && h > 0) {
          return self.chartHeight() - self.options.minimumBarHeight;
        } else {
          return self.yScale(d.freq);
        }
      });
  },

  showShadowBars: function () {
    this.model.set('show_shadow_bars', true);
  },

  _generateShadowBars: function () {
    var data = this._originalData && this._originalData.toJSON() || this.model.get('data');

    if (!data || !data.length || !this.model.get('show_shadow_bars')) {
      this._removeShadowBars();
      return;
    }

    this._removeShadowBars();

    var self = this;

    var yScale = d3.scale.linear().domain([0, d3.max(data, function (d) { return _.isEmpty(d) ? 0 : d.freq; })]).range([this.chartHeight(), 0]);

    var barWidth = this.chartWidth() / data.length;

    this.chart.append('g')
      .attr('transform', 'translate(0, 0)')
      .attr('class', 'CDB-Chart-shadowBars')
      .selectAll('.CDB-Chart-shadowBar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'CDB-Chart-shadowBar')
      .attr('data', function (d) { return _.isEmpty(d) ? 0 : d.freq; })
      .attr('transform', function (d, i) {
        return 'translate(' + (i * barWidth) + ', 0 )';
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
      .attr('width', Math.max(0, barWidth - 1))
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
  }
});
