cdb.geo.ui.Widget.Histogram.Chart = cdb.core.View.extend({

  defaults: {
    duration: 750,
    handleWidth: 6,
    handleHeight: 23,
    handleRadius: 3,
    transitionType: 'elastic'
  },

  initialize: function() {
    _.bindAll(this, '_selectBars', '_adjustBrushHandles', '_onBrushMove', '_onBrushStart', '_onMouseMove', '_onMouseOut');

    this._setupModel();
    this._setupDimensions();
  },

  render: function() {
    this._generateChart();
    this._generateChartContent();
    return this;
  },

  refresh: function() {
    this._removeChartContent();
    this._setupDimensions();
    this._generateChartContent();
  },

  _onChangeData: function() {
    if (!this.model.get('locked')) {
      this.refresh();
    }
  },

  _onChangeRange: function() {
    if (this.model.get('lo_index') === 0 && this.model.get('hi_index') === 0) {
      return;
    }
    this.trigger('range_updated', this.model.get('lo_index'), this.model.get('hi_index'));
  },

  _onResize: function() {
    var loBarIndex = this.model.get('lo_index');
    var hiBarIndex = this.model.get('hi_index');

    var width = this.model.get('width');

    this.$el.width(width);

    this.chart.attr('width', width);

    this._onChangeData();
    this.selectRange(loBarIndex, hiBarIndex);
  },

  _onChangePos: function() {
    var pos = this.model.get('pos');

    var x = +pos.x;
    var y = +pos.y;

    this.chart
    .transition()
    .duration(150)
    .attr('transform', 'translate(' + (this.margin.left + x) + ', ' + this.margin.top + y + ')');
  },

  _onBrushStart: function() {
    this.chart.classed('is-selectable', true);
  },

  _onChangeDragging: function() {
    this.chart.classed('is-dragging', this.model.get('dragging'));
  },

  _onBrushMove: function() {
    this.model.set({ dragging: true });
    this._selectBars();
    this._adjustBrushHandles();
  },

  _onMouseOut: function() {
    var bars = this.chart.selectAll('.Bar');
    bars.classed('is-highlighted', false);
    this.trigger('hover', { value: null });
  },

  _onMouseMove: function() {
    var x = d3.event.offsetX;
    var y = d3.event.offsetY;

    var barIndex = Math.floor(x / this.barWidth);
    var data = this.model.get('data');

    if (data[barIndex] === undefined || data[barIndex] === null) {
      return;
    }

    var freq = data[barIndex].freq;

    var format = d3.format('0,000');
    var bar = this.chart.select('.Bar:nth-child(' + (barIndex + 1) + ')');

    if (bar && bar.node() && !bar.classed('is-selected')) {
      var left = (barIndex * this.barWidth) + (this.barWidth/2) - 22;
      var top = this.yScale(freq) - 10 + this.model.get('pos').y;

      if (!this._isDragging()) {
        this.trigger('hover', { top: top, left: left, index: barIndex });
      } else {
        this.trigger('hover', { value: null });
      }

    } else {
      this.trigger('hover', { value: null });
    }

    this.chart.selectAll('.Bar')
    .classed('is-highlighted', false);

    if (bar && bar.node()) {
      bar.classed('is-highlighted', true);
    }
  },

  _formatNumber: function(value, unit) {
    var format = d3.format("0,000");
    return format(value + unit ? ' ' + unit : '');
  },

  _removeBars: function() {
    this.chart.selectAll('.Bars').remove();
  },

  _removeBrush: function() {
    this.chart.select('.Brush').remove();
    this.chart.classed('is-selectable', false);
  },

  _removeChartContent: function() {
    this._removeBrush();
    this._removeBars();
    this._removeHandles();
    this._removeXAxis();
    this._removeLines();
  },

  _generateChartContent: function() {
    this._generateLines();
    this._generateBars();
    this._generateHandles();
    this._setupBrush();
    this._generateXAxis();
  },

  resize: function(width) {
    this.model.set('width', width);
  },

  reset: function(data) {
    this.loadData(data);
    this.model.set({ lo_index: null, hi_index: null });
  },

  _removeLines: function() {
    this.chart.select('.Lines').remove();
  },

  _generateLines: function() {
    this._generateHorizontalLines();
    this._generateVerticalLines();
  },

  _generateVerticalLines: function() {
    var range = d3.range(0, this.chartWidth + this.chartWidth / 4, this.chartWidth / 4);

    var lines = this.chart.select('.Lines');

    lines.append('g')
    .selectAll('.Line')
    .data(range.slice(1, range.length - 1))
    .enter().append('svg:line')
    .attr('class', 'Line')
    .attr('y1', 0)
    .attr('x1', function(d) { return d; })
    .attr('y2', this.chartHeight)
    .attr('x2', function(d) { return d; });
  },

  _generateHorizontalLines: function() {
    var range = d3.range(0, this.chartHeight + this.chartHeight / 2, this.chartHeight / 2);

    var lines = this.chart.append('g')
    .attr('class', 'Lines');

    lines.append('g')
    .attr('class', 'y')
    .selectAll('.Line')
    .data(range)
    .enter().append('svg:line')
    .attr('class', 'Line')
    .attr('x1', 0)
    .attr('y1', function(d) { return d; })
    .attr('x2', this.chartWidth)
    .attr('y2', function(d) { return d; });

    this.bottomLine = lines
    .append('line')
    .attr('class', 'Line Line--bottom')
    .attr('x1', 0)
    .attr('y1', this.chartHeight)
    .attr('x2', this.chartWidth - 1)
    .attr('y2', this.chartHeight);
  },

  _bindModel: function() {
    this.model.bind('change:width', this._onResize, this);
    this.model.bind('change:pos', this._onChangePos, this);
    this.model.bind('change:lo_index change:hi_index', this._onChangeRange, this);
    this.model.bind('change:data', this._onChangeData, this);
    this.model.bind('change:dragging', this._onChangeDragging, this);
  },

  _setupModel: function() {
    this.model = new cdb.core.Model({
      locked: true,
      data: this.options.data,
      width: this.options.width,
      height: this.options.height,
      pos: { x: 0, y: 0 }
    });

    this._bindModel();
  },

  _setupDimensions: function() {
    this.margin = this.options.margin;

    this.canvasWidth  = this.model.get('width');
    this.canvasHeight = this.model.get('height');

    this.chartWidth  = this.canvasWidth - this.margin.left - this.margin.right;
    this.chartHeight = this.model.get('height');

    this._setupScales();
  },

  _setupScales: function() {
    var data = this.model.get('data');
    this.xScale = d3.scale.linear().domain([0, 100]).range([0, this.chartWidth]);
    this.yScale = d3.scale.linear().domain([0, d3.max(data, function(d) { return _.isEmpty(d) ? 0 : d.freq; } )]).range([this.chartHeight, 0]);
    this.zScale = d3.scale.ordinal().domain(d3.range(data.length)).rangeRoundBands([0, this.chartWidth]);
  },

  _calcBarWidth: function() {
    this.barWidth = this.chartWidth / this.model.get('data').length;
  },

  _generateChart: function() {
    this.chart = d3.select(this.options.el[0])
    .selectAll('.Canvas')
    .append('g')
    .attr('class', 'Chart')
    .attr('opacity', 0);

    this.chart.classed(this.options.className || '', true);
  },

  hide: function() {
    this.chart
    .transition()
    .duration(150)
    .attr('opacity', 0)
    .style('display', 'none')
    .attr('transform', 'translate(' + this.margin.left + ', ' + (this.options.y - 10) + ')');
  },

  show: function() {
    this.chart
    .attr('transform', 'translate(' + this.margin.left + ', ' + (this.options.y + 10) + ')')
    .transition()
    .duration(150)
    .attr('opacity', 1)
    .style('display', 'block')
    .attr('transform', 'translate(' + this.margin.left + ', ' + (this.options.y) + ')');
  },

  _selectBars: function() {
    var self = this;
    var extent = this.brush.extent();
    var lo = extent[0];
    var hi = extent[1];

    this.model.set({ lo_index: this._getLoBarIndex(), hi_index: this._getHiBarIndex() });

    this.chart.selectAll('.Bar').classed('is-selected', function(d, i) {
      var a = Math.floor(i * self.barWidth);
      var b = Math.floor(a + self.barWidth);
      var LO = Math.floor(self.xScale(lo));
      var HI = Math.floor(self.xScale(hi));
      var isIn = (a > LO && a < HI) || (b > LO && b < HI) || (a <= LO && b >= HI);
      return !isIn;
    });
  },

  _isDragging: function() {
    return this.model.get('dragging');
  },

  _move: function(pos) {
    this.model.set({ pos: pos });
  },

  expand: function() {
    this._move({ x: 0, y: 50 });
  },

  contract: function() {
    this.model.set({ locked: true });
    this._move({ x: 0, y: 0 });
  },

  removeSelection: function() {
    var data = this.model.get('data');
    this.selectRange(0, data.length - 1);
    this.resetBrush();
  },

  selectRange: function(loBarIndex, hiBarIndex) {

    if (!loBarIndex && !hiBarIndex) {
      return;
    }

    var loPosition = this._getBarPosition(loBarIndex);
    var hiPosition = this._getBarPosition(hiBarIndex);

    this._selectRange(loPosition, hiPosition);
  },

  _selectRange: function(loPosition, hiPosition) {
    this.chart.select('.Brush').transition()
    .duration(this.brush.empty() ? 0 : 150)
    .call(this.brush.extent([loPosition, hiPosition]))
    .call(this.brush.event);
  },

  _getLoBarIndex: function() {
    var extent = this.brush.extent();
    return Math.round(this.xScale(extent[0]) / this.barWidth);
  },

  _getHiBarIndex: function() {
    var extent = this.brush.extent();
    return Math.round(this.xScale(extent[1]) / this.barWidth);
  },

  _getBarIndex: function() {
    var x = d3.event.sourceEvent.offsetX;
    return Math.floor(x / this.barWidth);
  },

  _getBarPosition: function(index) {
    var data = this.model.get('data');
    return index * (100 / data.length);
  },

  _setupBrush: function() {
    var self = this;

    var xScale = this.xScale;
    var brush = this.brush = d3.svg.brush().x(this.xScale);

    function onBrushEnd() {
      var data = self.model.get('data');
      var loPosition, hiPosition;

      self.model.set({ dragging: false });

      if (brush.empty()) {
        self.chart.selectAll('.Bar').classed('is-selected', false);
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

    var data = this.model.get('data');

    this.brush
    .on('brushstart', this._onBrushStart)
    .on('brush', this._onBrushMove)
    .on('brushend', onBrushEnd);

    this.chart.append('g')
    .attr('class', 'Brush')
    .call(this.brush)
    .selectAll('rect')
    .attr('y', 0)
    .attr('height', this.chartHeight)
    .on('mouseout', this._onMouseOut)
    .on('mousemove', this._onMouseMove);
  },

  _adjustBrushHandles: function() {
    var extent = this.brush.extent();

    var loExtent = extent[0];
    var hiExtent = extent[1];

    this.leftHandleLine
    .attr('x1', this.xScale(loExtent))
    .attr('x2', this.xScale(loExtent));

    this.rightHandleLine
    .attr('x1', this.xScale(hiExtent))
    .attr('x2', this.xScale(hiExtent));

    if (this.options.handles) {
      this.leftHandle
      .attr('x', this.xScale(loExtent) - this.defaults.handleWidth / 2);

      this.rightHandle
      .attr('x', this.xScale(hiExtent) - this.defaults.handleWidth / 2);
    }
  },

  _generateHandle: function() {
    var handle = { width: this.defaults.handleWidth, height: this.defaults.handleHeight, radius: this.defaults.handleRadius };
    var yPos = (this.chartHeight / 2) - (this.defaults.handleHeight / 2);

    return this.chart.select('.Handles').append('rect')
    .attr('class', 'Handle')
    .attr('transform', 'translate(0, ' + yPos + ')')
    .attr('width', handle.width)
    .attr('height', handle.height)
    .attr('rx', handle.radius)
    .attr('ry', handle.radius);
  },

  _generateHandleLine: function() {
    return this.chart.select('.Handles').append('line')
    .attr('class', 'HandleLine')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 0)
    .attr('y2', this.chartHeight);
  },

  _removeHandles: function() {
    this.chart.select('.Handles').remove();
  },

  _generateHandles: function() {
    this.chart.append('g').attr('class', 'Handles');
    this.leftHandleLine  = this._generateHandleLine();
    this.rightHandleLine = this._generateHandleLine();

    if (this.options.handles) {
      this.leftHandle      = this._generateHandle();
      this.rightHandle     = this._generateHandle();
    }
  },

  _removeXAxis: function() {
    this.chart.select('.Axis').remove();
  },

  _generateXAxis: function() {
    var data = this.model.get('data');

    var format = d3.format('0,000');

    var xAxis = d3.svg.axis()
    .scale(this.zScale)
    .orient('bottom')
    .innerTickSize(0)
    .tickFormat(function(d, i) {
      function calculateBins(n) {
        if (n % 2 === 0) return 4;
        else return 4;
      }

      var p = Math.round(data.length / calculateBins(data.length));
      var v = i % p;

      if (v === 0 || i === 0 || i === (data.length - 1)) {
        var sum = _.reduce(data.slice(0, i + 1), function(memo, d) {
          return _.isEmpty(d) ? memo : d.freq + memo;
        }, 0);
        return format(sum);
      } else {
        return '';
      }
    });

    this.chart.append('g')
    .attr('class', 'Axis')
    .attr('transform', 'translate(0,' + (this.chartHeight + 5) + ')')
    .call(xAxis);
  },

  loadData: function(data) {
    if (data && data.toJSON) {
      data = data.toJSON();
    }

    this.model.set({ lo_index: null, hi_index: null }, { silent: true });
    this.model.set('data', data);
    this._onChangeData();
  },

  resetBrush: function() {
    this.selectRange(0, 10);

    var self = this;
    setTimeout(function() {
      self._removeBrush();
      self._setupBrush();
    }, 200);
  },

  _generateBars: function() {
    var self = this;
    var data = this.model.get('data');

    this._calcBarWidth();

    var bars = this.chart.append('g')

    .attr('transform', 'translate(0, 0 )')
    .attr('class', 'Bars')
    .selectAll('.Bar')
    .data(data);

    bars
    .enter()
    .append('rect')
    .attr('class', 'Bar')
    .attr('data', function(d) { return _.isEmpty(d) ? 0 :  d.freq; })
    .attr('transform', function(d, i) {
      return 'translate(' + (i * self.barWidth) + ', 0 )';
    })
    .attr('y', self.chartHeight)
    .attr('height', 0)
    .attr('width', this.barWidth - 1);

    bars.transition()
    .ease(this.defaults.transitionType)
    .duration(self.defaults.duration)
    .delay(function(d, i) {
      return Math.random() * (100 + i * 10);
    })
    .attr('height', function(d) {
      return _.isEmpty(d) ? 0 : self.chartHeight - self.yScale(d.freq);
    })
    .attr('y', function(d) {
      return _.isEmpty(d) ? self.chartHeight : self.yScale(d.freq);
    });
  }

});

/**
 *  Default widget content view:
 *
 *
 */

cdb.geo.ui.Widget.Histogram.Content = cdb.geo.ui.Widget.Content.extend({

  defaults: {
    chartHeight: 48
  },

  events: {
    'click .js-clear': '_reset',
    'click .js-zoom': '_zoom'
  },

  _TEMPLATE: ' ' +
   '<div class="Widget-header">'+
      '<div class="Widget-title Widget-contentSpaced">'+
        '<h3 class="Widget-textBig"><%= title %></h3>'+
      '</div>'+
     '<dl class="Widget-info Widget-textSmaller Widget-textSmaller--upper">'+
       '<dt class="Widget-infoItem js-null">0 NULL ROWS</dt>'+
       '<dt class="Widget-infoItem js-min">0 MIN</dt>'+
       '<dt class="Widget-infoItem js-avg">0 AVG</dt>'+
       '<dt class="Widget-infoItem js-max">0 MAX</dt>'+
     '</dl>'+
   '</div>'+
    '<div class="Widget-content js-content">'+
   '<div class="Widget-chartTooltip js-tooltip"></div>'+
   '  <div class="Widget-filter Widget-contentSpaced js-filter">'+
   '    <p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmaller--upper js-val"></p>'+
   '    <div class="Widget-filterButtons">'+
   '      <button class="Widget-link Widget-filterButton js-zoom">zoom</button>'+
   '      <button class="Widget-link Widget-filterButton js-clear">clear</button>'+
   '    </div>'+
   '  </div>'+
   '  <svg class="Widget-chart js-chart"></svg>',

  _PLACEHOLDER: ' ' +
    '<ul class="Widget-chart Widget-chart--fake">' +
      '<% for (var i = 0; i < 18; i++) { %>' +
      '<li class="Widget-chartItem Widget-chartItem--<%- _.sample(["small", "medium", "big"], 1)[0] %> Widget-chartItem--fake"></li>' +
      '<% } %>' +
    '</ul>',

  _initViews: function() {
    this.$('.js-chart').show();
    this._setupDimensions();
    this._generateCanvas();
    this._renderMainChart();
    this._renderMiniChart();
  },

  _initBinds: function() {
    this.dataModel.bind('change:data', this._onFirstLoad, this);
    this.add_related_model(this.dataModel);
  },

  _onFirstLoad: function() {
    this.render();
    this.dataModel.unbind('change:data', this._onFirstLoad, this);
    this.dataModel.bind('change:data', this._onChangeData, this);
  },

  _onChangeData: function() {
    var data = this._getData(true);
    this.chart.loadData(data);
  },

  render: function() {

    this.clearSubViews();

    _.bindAll(this, '_onWindowResize');

    $(window).bind('resize', this._onWindowResize);

    var template = _.template(this._TEMPLATE);
    var data = this.dataModel.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;

    this.originalDataModel = _.clone(this.dataModel.getData());

    window.viewModel = this.viewModel; // TODO: remove
    window.dataModel = this.dataModel; // TODO: remove
    window.originalDataModel = this.originalDataModel; // TODO: remove
    window.filter = this.filter; // TODO: remove

    this.$el.html(
      template({
        title: this.viewModel.get('title'),
        itemsCount: !isDataEmpty ? data.length : '-'
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
    } else {
      this._setupBindings();
      this._initViews();
    }

    return this;
  },

  _onWindowResize: function() {
    this._setupDimensions();
    this.chart.resize(this.canvasWidth);
    this.miniChart.resize(this.canvasWidth);
  },

  _renderMainChart: function() {
    this.chart = new cdb.geo.ui.Widget.Histogram.Chart(({
      el: this.$('.js-chart'),
      y: 0,
      margin: { top: 0, right: 4, bottom: 20, left: 4 },
      handles: true,
      width: this.canvasWidth,
      height: this.defaults.chartHeight,
      data: this._getData()
    }));

    this.chart.bind('range_updated', this._onRangeUpdated, this);
    this.chart.bind('on_brush_end', this._onBrushEnd, this);
    this.chart.bind('hover', this._onValueHover, this);
    this.chart.render().show();

    window.chart = this.chart; // TODO: remove

    this._updateStats();
  },

  _renderMiniChart: function() {
    this.miniChart = new cdb.geo.ui.Widget.Histogram.Chart(({
      className: 'mini',
      el: this.$('.js-chart'),
      handles: false,
      width: this.canvasWidth,
      margin: { top: 0, right: 0, bottom: 0, left: 4 },
      y: 0,
      height: 20,
      data: this._getData()
    }));

    this.miniChart.bind('on_brush_end', this._onMiniRangeUpdated, this);
    this.miniChart.render().hide();
    window.miniChart = this.miniChart; // TODO: remove
  },

  _setupBindings: function() {
    this.viewModel.bind('change:zoom_enabled', this._onChangeZoomEnabled, this);
    this.viewModel.bind('change:total', this._onChangeTotal, this);
    this.viewModel.bind('change:max',   this._onChangeMax, this);
    this.viewModel.bind('change:min',   this._onChangeMin, this);
    this.viewModel.bind('change:avg',   this._onChangeAvg, this);
  },

  _setupDimensions: function() {
    this.margin = { top: 0, right: 24, bottom: 20, left: 24 };

    this.canvasWidth  = this.$el.width() - this.margin.left - this.margin.right;
    this.canvasHeight = this.defaults.chartHeight + this.margin.top + this.margin.bottom;
  },

  _onValueHover: function(info) {
    var $tooltip = this.$(".js-tooltip");
    var value;

    if (info.index !== undefined) {

      if (this.chart.model.get('locked')) {
        value = originalDataModel.toJSON()[info.index].freq;
      } else {
        value = dataModel.getData().toJSON()[info.index].freq;
      }

      if (value !== undefined) {
        $tooltip.css({ top: info.top, left: info.left });
        $tooltip.text(value);
        $tooltip.fadeIn(70);
      } else {
        $tooltip.stop().fadeOut(50);
      }
    } else {
      $tooltip.stop().fadeOut(50);
    }
  },

  _onMiniRangeUpdated: function(loBarIndex, hiBarIndex) {
    this.viewModel.set({ lo_index: loBarIndex, hi_index: hiBarIndex });
    var data = this._getOriginalData();

    var min = data[loBarIndex].min;
    var max = data[hiBarIndex - 1].max;

    this.filter.setRange({ min: min, max: max });
    this._updateStats();
  },

  _onBrushEnd: function(loBarIndex, hiBarIndex) {
    this.viewModel.set({ lo_index: loBarIndex, hi_index: hiBarIndex });
    this.$(".js-filter").animate({ opacity: 1 }, 250);

    var data = this._getData();
    var min = data[0].min;
    var max = data[data.length - 1].max;

    this.filter.setRange({ min: min, max: max });
  },

  _onRangeUpdated: function(loBarIndex, hiBarIndex) {
    this.viewModel.set({ lo_index: loBarIndex, hi_index: hiBarIndex });
    this.$(".js-filter").animate({ opacity: 1 }, 250);
    this._updateStats();
  },

  _onChangeZoomEnabled: function() {
    this.$(".js-zoom").toggleClass('is-hidden', !this.viewModel.get('zoom_enabled'));
  },

  _onChangeTotal: function() {
    this._animateValue('.js-val', 'total', ' SELECTED');
  },

  _onChangeMax: function() {
    this._animateValue('.js-max', 'max', 'MAX');
  },

  _onChangeMin: function() {
    this._animateValue('.js-min', 'min', 'MIN');
  },

  _onChangeAvg: function() {
    this._animateValue('.js-avg', 'avg', 'AVG');
  },

  _animateValue: function(className, what, unit) {
    var self = this;
    var format = d3.format("0,000");

    var from = this.viewModel.previous(what) || 0;
    var to = this.viewModel.get(what);

    $(className).prop('counter', from).stop().animate({ counter: to }, {
      duration: 500,
      easing: 'swing',
      step: function (i) {
        if (i === isNaN) {
          i = 0;
        }
        var v = Math.floor(i);
        $(this).text(format(v) + ' ' + unit);
      }
    });
  },

  _getOriginalData: function() {
    return this.originalDataModel.toJSON();
  },

  _getData: function(full) {
    var data = this.dataModel.getData().toJSON();

    if (full || (!this.viewModel.get('lo_index') && !this.viewModel.get('hi_index'))) {
      return data;
    }

    return data.slice(this.viewModel.get('lo_index'), this.viewModel.get('hi_index'));
  },

  _updateStats: function() {
    var data = this._getOriginalData();

    var loBarIndex = this.viewModel.get('lo_index') || 0;
    var hiBarIndex = this.viewModel.get('hi_index') ?  this.viewModel.get('hi_index') - 1 : data.length - 1;

    var sum = _.reduce(data.slice(loBarIndex, hiBarIndex + 1), function(memo, d) {
      return _.isEmpty(d) ? memo : d.freq + memo;
    }, 0);

    var avg = Math.round(d3.mean(data, function(d) { return _.isEmpty(d) ? 0 : d.freq; }));
    var min = data && data.length && data[loBarIndex].min;
    var max = data && data.length && data[hiBarIndex].max;

    this.viewModel.set({ total: sum, min: min, max: max, avg: avg });
  },

  _zoom: function() {
    this.chart.model.set({ locked: false });
    this._expand();
    this.viewModel.set({ zoom_enabled: false });

    var data = this._getOriginalData();

    var loBarIndex = this.viewModel.get('lo_index');
    var hiBarIndex = this.viewModel.get('hi_index');

    var min = data[loBarIndex].min;
    var max = data[hiBarIndex - 1].max;

    this.miniChart.selectRange(loBarIndex, hiBarIndex);
    this.miniChart.show();

    this.filter.setRange({ min: min, max: max });
    this.chart.refresh();

  },

  _reset: function() {

    this.chart.model.set('data', this.originalDataModel.toJSON());

    this._contract();

    this.viewModel.set({ zoom_enabled: true, lo_index: null, hi_index: null });
    this.chart.model.set({ lo_index: null, hi_index: null });

    this.filter.unsetRange();

    this.miniChart.hide();

    this.$(".js-filter").animate({ opacity: 0 }, 0);
    this.chart.removeSelection();
  },

  _contract: function() {
    this.canvas
    .attr('height', this.canvasHeight);
    this.chart.contract();
  },

  _expand: function() {
    this.canvas
    .attr('height', this.canvasHeight + 60);
    this.miniChart.show();
    this.chart.expand();
  },

  _generateCanvas: function() {
    this.canvas = d3.select(this.$el.find('.js-chart')[0])
    .attr('width',  this.canvasWidth)
    .attr('height', this.canvasHeight);

    this.canvas
    .append('g')
    .attr('class', 'Canvas');
  },

  clean: function() {
    $(window).unbind('resize', this._onWindowResize);
    cdb.core.View.prototype.clean.call(this);
  }
});
