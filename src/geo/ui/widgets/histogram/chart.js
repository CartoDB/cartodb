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

  replaceData: function(data) {
    if (!this.isLocked()) {
      //console.log('updating')
      this.model.set({ data: data });
    } else {
      //console.log('not updating');
      this.unlock();
    }
  },

  _onChangeData: function() {
    if (!this.isLocked()) {
      this.refresh();
    }

    this.unlock();
  },

  _onChangeRange: function() {
    if (this.model.get('lo_index') === 0 && this.model.get('hi_index') === 0) {
      return;
    }
    this.trigger('range_updated', this.model.get('lo_index'), this.model.get('hi_index'));
  },

  _onChangeWidth: function() {
    var loBarIndex = this.model.get('lo_index');
    var hiBarIndex = this.model.get('hi_index');

    var width = this.model.get('width');

    this.$el.width(width);

    this.chart.attr('width', width);

    this.refresh();
    this.selectRange(loBarIndex, hiBarIndex);
  },

  _onChangePos: function() {
    var pos = this.model.get('pos');

    var x = +pos.x;
    var y = +pos.y;

    this.chart
    .transition()
    .duration(150)
    .attr('transform', 'translate(' + (this.margin.left + x) + ', ' + (this.margin.top + y) + ')');
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
    var data = this.originalData;

    if (data[barIndex] === undefined || data[barIndex] === null) {
      return;
    }

    var freq = data[barIndex].freq;

    var format = d3.format('0,000');
    var bar = this.chart.select('.Bar:nth-child(' + (barIndex + 1) + ')');

    if (bar && bar.node() && !bar.classed('is-selected')) {
      var left = (barIndex * this.barWidth) + (this.barWidth/2) - 22;
      var topMargin = 0;
      var top = this.yScale(freq) - 20 + this.model.get('pos').y + this.$el.position().top;

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

  _bindModel: function() {
    this.model.bind('change:width', this._onChangeWidth, this);
    this.model.bind('change:pos', this._onChangePos, this);
    this.model.bind('change:lo_index change:hi_index', this._onChangeRange, this);
    this.model.bind('change:data', this._onChangeData, this);
    this.model.bind('change:dragging', this._onChangeDragging, this);
  },

  refresh: function() {
    this._removeChartContent();
    this._setupDimensions();
    this._generateChartContent();
  },

  lock: function() {
    this.model.set('locked', true);
  },

  unlock: function() {
    this.model.set('locked', false);
  },

  isLocked: function() {
    return this.model.get('locked');
  },

  resetIndexes: function() {
    this.model.set({ lo_index: null, hi_index: null });
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

  _setupModel: function() {
    this.model = new cdb.core.Model({
      locked: false,
      data: this.options.data,
      width: this.options.width,
      height: this.options.height,
      pos: { x: 0, y: 0 }
    });

    this.originalData = _.clone(this.options.data);

    this._bindModel();
  },

  _setupDimensions: function() {
    this.margin = this.options.margin;

    this.canvasWidth  = this.model.get('width');
    this.canvasHeight = this.model.get('height');

    this.chartWidth  = this.canvasWidth - this.margin.left - this.margin.right;
    this.chartHeight = this.model.get('height') - this.margin.top - this.margin.bottom;

    this._setupScales();
  },

  _setupScales: function() {
    var data = this.model.get('data');
    this.xScale = d3.scale.linear().domain([0, 100]).range([0, this.chartWidth]);
    this.yScale = d3.scale.linear().domain([0, d3.max(data, function(d) { return _.isEmpty(d) ? 0 : d.freq; } )]).range([this.chartHeight, 0]);
    this.yScale2 = d3.scale.linear().domain([0, d3.max(this.originalData, function(d) { return _.isEmpty(d) ? 0 : d.freq; } )]).range([this.chartHeight, 0]);
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
    .attr('transform', 'translate(' + this.margin.left + ', ' + (this.margin.top + this.options.y - 10) + ')');
  },

  show: function() {
    this.chart
    .attr('transform', 'translate(' + this.margin.left + ', ' + (this.margin.top + this.options.y + 10) + ')')
    .transition()
    .duration(150)
    .attr('opacity', 1)
    .style('display', 'block')
    .attr('transform', 'translate(' + this.margin.left + ', ' + (this.margin.top + this.options.y) + ')');
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

    var leftX  = this.xScale(loExtent) - this.defaults.handleWidth / 2;
    var rightX = this.xScale(hiExtent) - this.defaults.handleWidth / 2;

    this.chart.select('.Handle-left')
    .attr('transform', 'translate(' + leftX + ', 0)');

    this.chart.select('.Handle-right')
    .attr('transform', 'translate(' + rightX + ', 0)');
  },

  _generateHandle: function(className) {
    var handle = { width: this.defaults.handleWidth, height: this.defaults.handleHeight, radius: this.defaults.handleRadius };
    var yPos = (this.chartHeight / 2) - (this.defaults.handleHeight / 2);

    var handles = this.chart.select('.Handles')
    .append('g')
    .attr('class', 'Handle ' + className);

    handles
    .append('line')
    .attr('class', 'HandleLine')
    .attr('x1', 3)
    .attr('y1', -4)
    .attr('x2', 3)
    .attr('y2', this.chartHeight + 4);

    if (this.options.handles) {
      handles
      .append('rect')
      .attr('class', 'HandleRect')
      .attr('transform', 'translate(0, ' + yPos + ')')
      .attr('width', handle.width)
      .attr('height', handle.height)
      .attr('rx', handle.radius)
      .attr('ry', handle.radius);

      var y = 21; // initial position of the first grip

      for (var i = 0; i < 3; i++) {
        handles
        .append('line')
        .attr('class', 'HandleGrip')
        .attr('x1', 2)
        .attr('y1', y + i*3)
        .attr('x2', 4)
        .attr('y2', y + i*3);
      }
    }

    return handles;
  },

  _generateHandles: function() {
    this.chart.append('g').attr('class', 'Handles');
    this.leftHandle  = this._generateHandle('Handle-left');
    this.rightHandle = this._generateHandle('Handle-right');
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
          return _.isEmpty(d) ? memo : d.start + memo;
        }, 0);
        return format(sum.toFixed(2));
      } else {
        return '';
      }
    });

    this.chart.append('g')
    .attr('class', 'Axis')
    .attr('transform', 'translate(0,' + (this.chartHeight + 5) + ')')
    .call(xAxis);
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
