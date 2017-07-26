var d3 = require('d3');
var cdb = require('cartodb.js');


var FILTERED_COLOR = '#1181FB';
var UNFILTERED_COLOR = 'rgba(0, 0, 0, 0.06)';
var TIP_RECT_HEIGHT = 17;
var TIP_H_PADDING = 6;
var TRIANGLE_SIDE = 14;
var TRIANGLE_HEIGHT = 7;
// How much lower (based on height) will the triangle be on the right side
var TRIANGLE_RIGHT_FACTOR = 1.3;
var TOOLTIP_MARGIN = 2;
var DASH_WIDTH = 4;

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


/**
 * Time-slider, expected to be used in a histogram view
 */
module.exports = cdb.core.View.extend({
  defaults: {
    width: 6,
    height: 8
  },

  initialize: function () {
    if (!this.options.chartView) throw new Error('chartView is required');
    if (!this.options.torqueLayerModel) throw new Error('torqeLayerModel is required');

    this.model = new cdb.core.Model();

    this._dataviewModel = this.options.dataviewModel;
    this._chartView = this.options.chartView;
    this._torqueLayerModel = this.options.torqueLayerModel;

    this._chartMargins = this._chartView.model.get('margin');
    this._initBinds();
    this._updateXScale();
  },

  render: function () {
    // Make the render call idempotent; only create time slider once
    if (!this.timeSlider) {
      var dragBehavior = d3.behavior.drag()
        .on('dragstart', this._onDragStart.bind(this))
        .on('drag', this._onDrag.bind(this))
        .on('dragend', this._onDragEnd.bind(this));

      var d3el = this._chartView.canvas.append('rect');
      this.timeSlider = d3el
        .attr('class', 'CDB-TimeSlider')
        .attr('width', this.defaults.width)
        .attr('height', this._calcHeight())
        .attr('rx', 3)
        .attr('ry', 3)
        .data([{ x: 0, y: 0 }])
        .attr('transform', this._translateXY)
        .call(dragBehavior);
    }
    this.setElement(d3el.node());

    this._generateTimeSliderTip();

    return this;
  },

  _generateTimeSliderTip: function () {
    var yPos = -(TRIANGLE_HEIGHT + TIP_RECT_HEIGHT + TOOLTIP_MARGIN);
    var yTriangle = -(TRIANGLE_HEIGHT + TOOLTIP_MARGIN) - 2;
    var yFactor = 1;
    var triangleHeight = TRIANGLE_HEIGHT * yFactor;

    var timeSliderTip = this.timeSlider.selectAll('g')
      .data([''])
      .enter().append('g')
      .attr('class', 'CDB-Chart-axisTip CDB-Chart-axisTip-left')
      .attr('transform', 'translate(0,' + yPos + ')');

    this.timeSlider.append('path')
      .attr('class', 'CDB-Chart-axisTipRect CDB-Chart-axisTipTriangle')
      // .attr('transform', 'translate(' + ((this.options.handleWidth / 2) - (TRIANGLE_SIDE / 2)) + ', ' + yTriangle + ')')
      .attr('transform', 'translate(' + ((10 / 2) - (TRIANGLE_SIDE / 2)) + ', ' + yTriangle + ')')
      .attr('d', trianglePath(0, 0, TRIANGLE_SIDE, 0, (TRIANGLE_SIDE / 2), triangleHeight, yFactor))
      .style('opacity', '0');

    timeSliderTip.append('rect')
      .attr('class', 'CDB-Chart-axisTipRect CDB-Chart-axisTip-left')
      .attr('rx', '2')
      .attr('ry', '2')
      .attr('height', TIP_RECT_HEIGHT);

    timeSliderTip.append('text')
      .attr('class', 'CDB-Text CDB-Size-small CDB-Chart-axisTipText CDB-Chart-axisTip-left')
      .attr('dy', '11')
      .attr('dx', '0')
      .text(function (d) { return d; });
  },

  _updateTimeSliderTip: function () {
    debugger;
    // var model = this.model.get(className + '_axis_tip');
    // if (model === undefined) { return; }

    // var textLabel = this.chart.select('.CDB-Chart-axisTipText.CDB-Chart-axisTip-' + className);
    // var axisTip = this.chart.select('.CDB-Chart-axisTip.CDB-Chart-axisTip-' + className);
    // var rectLabel = this.chart.select('.CDB-Chart-axisTipRect.CDB-Chart-axisTip-' + className);
    // var handle = this.chart.select('.CDB-Chart-handle.CDB-Chart-handle-' + className);
    // var triangle = handle.select('.CDB-Chart-axisTipTriangle');

    // triangle.style('opacity', '1');

    // textLabel.data([model]).text(function (d) {
    //   return this.formatter(d, this.model.get('local_timezone'));
    // }.bind(this));

    // if (!textLabel.node()) {
    //   return;
    // }

    // var textBBox = textLabel.node().getBBox();
    // var width = textBBox.width;
    // var rectWidth = width + TIP_H_PADDING;

    // rectLabel.attr('width', width + TIP_H_PADDING);
    // textLabel.attr('dx', TIP_H_PADDING / 2);
    // textLabel.attr('dy', textBBox.height - Math.abs((textBBox.height - TIP_RECT_HEIGHT) / 2));

    // var parts = d3.transform(handle.attr('transform')).translate;
    // var xPos = +parts[0] + (this.options.handleWidth / 2);

    // var yPos = className === 'left' ? -(TRIANGLE_HEIGHT + TIP_RECT_HEIGHT + TOOLTIP_MARGIN) : this.chartHeight() + (TRIANGLE_HEIGHT * TRIANGLE_RIGHT_FACTOR);
    // yPos = Math.floor(yPos);

    // this._updateTriangle(className, triangle, xPos);

    // if ((xPos - width / 2) < 0) {
    //   axisTip.attr('transform', 'translate(' + -xPos + ',' + yPos + ' )');
    // } else if ((xPos + width / 2 + 2) >= this.chartWidth()) {
    //   var newX = this.chartWidth() - (xPos + rectWidth);
    //   newX += this.options.handleWidth;
    //   axisTip.attr('transform', 'translate(' + newX + ', ' + yPos + ')');
    // } else {
    //   axisTip.attr('transform', 'translate(-' + Math.max(((rectWidth / 2) - (this.options.handleWidth / 2)), 0) + ', ' + yPos + ')');
    // }
  },

  _initBinds: function () {
    this.listenTo(this._torqueLayerModel, 'change:start change:end', this._updateChartandTimeslider);
    this.listenTo(this._torqueLayerModel, 'change:step', this._onChangeStep);
    this.listenTo(this._torqueLayerModel, 'change:steps', this._updateChartandTimeslider);

    this.listenTo(this._chartView.model, 'change:width', this._updateChartandTimeslider);
    this.listenTo(this._chartView.model, 'change:height', this._onChangeChartHeight);

    this.listenTo(this._dataviewModel, 'change:bins', this._updateChartandTimeslider);
    this.listenTo(this._dataviewModel.filter, 'change:min change:max', this._onFilterMinMaxChange);
  },

  clean: function () {
    if (this.timeSlider) {
      this.timeSlider.remove();
    }
    cdb.core.View.prototype.clean.call(this);
  },

  _onFilterMinMaxChange: function (m, isFiltering) {
    this.$el.toggle(!isFiltering);
  },

  _onDragStart: function () {
    var isRunning = this._torqueLayerModel.get('isRunning');
    if (isRunning) {
      this._torqueLayerModel.pause();
    }
    this.model.set({
      isDragging: true,
      wasRunning: isRunning
    });
  },

  _onDrag: function (d, i) {
    var nextX = d.x + d3.event.dx;
    if (this._isWithinRange(nextX)) {
      d.x = nextX;
      this.timeSlider.attr('transform', this._translateXY);

      var step = Math.round(this._xScale.invert(d.x));
      this._torqueLayerModel.setStep(step);
    }
  },

  _onDragEnd: function () {
    this.model.set('isDragging', false);
    if (this.model.get('wasRunning')) {
      this._torqueLayerModel.play();
    }
  },

  _translateXY: function (d) {
    return 'translate(' + [d.x, d.y] + ')';
  },

  _isWithinRange: function (x) {
    return x >= this._chartMargins.left && x <= this._width() - this._chartMargins.right;
  },

  _onChangeStep: function () {
    // Time slider might not be created when this method is first called
    if (this.timeSlider && !this.model.get('isDragging')) {
      var data = this.timeSlider.data();
      var newX = this._xScale(this._torqueLayerModel.get('step'));
      if (!isNaN(newX)) {
        data[0].x = newX;
        this.timeSlider
          .data(data)
          .transition()
          .ease('linear')
          .attr('transform', this._translateXY);

          this._updateTimeSliderTip();
      }
    }
  },

  _onChangeChartHeight: function () {
    this.timeSlider.attr('height', this._calcHeight());
  },

  _updateChartandTimeslider: function () {
    this._updateXScale();
    this._onChangeStep();
  },

  _calcHeight: function () {
    return this._chartView.chartHeight() + this.defaults.height;
  },

  _updateXScale: function () {
    // calculate range based on the torque layer bounds (that are not the same than the histogram ones)
    var range = 1000 * (this._dataviewModel.get('end') - this._dataviewModel.get('start'));
    // get normalized start and end
    var start = (this._torqueLayerModel.get('start') - 1000 * this._dataviewModel.get('start')) / range;
    var end = (this._torqueLayerModel.get('end') - 1000 * this._dataviewModel.get('start')) / range;

    this._xScale = d3.scale.linear()
      .domain([0, this._torqueLayerModel.get('steps')])
      .range([(start * this._width()) + this._chartMargins.left, (end * this._width()) - this._chartMargins.right]);
  },

  _width: function () {
    return this._chartView.model.get('width');
  }
});
