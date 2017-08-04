var d3 = require('d3');
var cdb = require('cartodb.js');
var moment = require('moment');
var formatter = require('../../formatter');
var viewportUtils = require('../../viewport-utils');

var TIP_RECT_HEIGHT = 17;
var TIP_H_PADDING = 6;
var CHART_MARGIN = 16;
var MOBILE_BAR_HEIGHT = 3;
var TOOLTIP_MARGIN = 2;

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
    if (!this.options.timeSeriesModel) throw new Error('timeSeriesModel is required');

    this.model = new cdb.core.Model();

    this._dataviewModel = this.options.dataviewModel;
    this._chartView = this.options.chartView;
    this._torqueLayerModel = this.options.torqueLayerModel;
    this._timeSeriesModel = this.options.timeSeriesModel;

    this._chartMargins = this._chartView.model.get('margin');

    this._initBinds();
    this._updateXScale();
    this._createFormatter();
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

      this.setElement(d3el.node());
    }

    if (this._isTabletViewport()) {
      this._generateTimeSliderTip();
    }

    return this;
  },

  _isTabletViewport: function () {
    return viewportUtils.isTabletViewport();
  },

  _generateTimeSliderTip: function () {
    var yPos = this._calcHeight() / 2 + MOBILE_BAR_HEIGHT + TOOLTIP_MARGIN;
    yPos = Math.floor(yPos);

    this.timeSliderTip = this._chartView.canvas.select('.CDB-WidgetCanvas').append('g')
      .attr('class', 'CDB-Chart-timeSliderTip')
      .data([{ x: CHART_MARGIN, y: yPos }])
      .attr('transform', this._translateXY);

    this.timeSliderTip.append('rect')
      .attr('class', 'CDB-Chart-timeSliderTipRect')
      .attr('rx', '2')
      .attr('ry', '2')
      .attr('height', TIP_RECT_HEIGHT);

    this.timeSliderTip.append('text')
      .attr('class', 'CDB-Text CDB-Size-small CDB-Chart-timeSliderTipText')
      .attr('dy', '11')
      .attr('dx', '0');
  },

  _onLocalTimezoneChanged: function () {
    this._createFormatter();
    this._updateTimeSliderTip();
  },

  _updateTimeSliderTip: function () {
    var self = this;

    var textLabelData = this._isDateTimeSeries() ? this._torqueLayerModel.get('time') : this._torqueLayerModel.get('step');

    if (textLabelData === void 0) {
      return;
    }

    var chart = this._chartView.canvas;
    var textLabel = chart.select('.CDB-Chart-timeSliderTipText');

    var scale = d3.scale.linear()
      .domain([0, this._dataviewModel.get('data').length])
      .range([this._dataviewModel.get('start'), this._dataviewModel.get('end')]);

    textLabel
      .data([textLabelData])
      .text(function (d) {
        return self._isDateTimeSeries() ? this.formatter(moment(d).unix()) : this.formatter(scale(d));
      }.bind(this));

    if (!textLabel.node()) {
      return;
    }

    var rectLabel = chart.select('.CDB-Chart-timeSliderTipRect');
    var textBBox = textLabel.node().getBBox();
    var width = textBBox.width;
    var rectWidth = width + TIP_H_PADDING;
    var chartWidth = this._chartView.chartWidth() + CHART_MARGIN;

    rectLabel.attr('width', rectWidth);
    textLabel.attr('dx', TIP_H_PADDING / 2);
    textLabel.attr('dy', textBBox.height - Math.abs((textBBox.height - TIP_RECT_HEIGHT) / 2));

    var timeSliderX = this._xScale(this._torqueLayerModel.get('step'));
    var xPos = timeSliderX + this.defaults.width - rectWidth / 2;
    var yPos = this._calcHeight() / 2 + MOBILE_BAR_HEIGHT + TOOLTIP_MARGIN;
    yPos = Math.floor(yPos);

    var timeSliderTipData = this.timeSliderTip.data();
    timeSliderTipData[0].y = yPos;

    var newX = xPos;

    if (xPos < CHART_MARGIN) {
      newX = CHART_MARGIN;
    } else if ((xPos + rectWidth) >= chartWidth) {
      newX = chartWidth - rectWidth;
    }

    if (!isNaN(newX)) {
      timeSliderTipData[0].x = newX;

      this.timeSliderTip
        .data(timeSliderTipData)
        .transition()
        .ease('linear')
        .attr('transform', this._translateXY);
    }
  },

  _initBinds: function () {
    this.listenTo(this._torqueLayerModel, 'change:start change:end', this._updateChartandTimeslider);
    this.listenTo(this._torqueLayerModel, 'change:step', this._onChangeStep);
    this.listenTo(this._torqueLayerModel, 'change:time', this._onChangeTime);
    this.listenTo(this._torqueLayerModel, 'change:steps', this._updateChartandTimeslider);

    this.listenTo(this._chartView.model, 'change:width', this._updateChartandTimeslider);
    this.listenTo(this._chartView.model, 'change:height', this._onChangeChartHeight);

    this.listenTo(this._dataviewModel, 'change:bins', this._updateChartandTimeslider);
    this.listenTo(this._dataviewModel, 'change:column_type', this._createFormatter);
    this.listenTo(this._dataviewModel.filter, 'change:min change:max', this._onFilterMinMaxChange);

    this.listenTo(this._timeSeriesModel, 'change:local_timezone', this._onLocalTimezoneChanged);

    this.listenTo(this._dataviewModel, 'change:start change:end', this._updateChartandTimeslider);
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
      }
    }
  },

  _onChangeChartHeight: function () {
    var height = this._isTabletViewport() ? this._calcHeight() / 2 + MOBILE_BAR_HEIGHT : this._calcHeight();

    this.timeSlider.attr('height', height);
  },

  _onChangeTime: function () {
    if (this._dataviewModel.filter.isEmpty() && this._isTabletViewport()) {
      var timeSliderTip = this._chartView.canvas.select('.CDB-Chart-timeSliderTip');

      if (!timeSliderTip.node()) {
        this._generateTimeSliderTip();
      }

      this._updateTimeSliderTip();
    } else {
      this._removeTimeSliderTip();
    }
  },

  _removeTimeSliderTip: function () {
    var timeSliderTip = this._chartView.canvas.select('.CDB-Chart-timeSliderTip');

    if (timeSliderTip.node()) {
      timeSliderTip.remove();
    }
  },

  _updateChartandTimeslider: function () {
    this._updateXScale();
    this._onChangeStep();
  },

  _calcHeight: function () {
    return this._chartView.chartHeight() + this.defaults.height;
  },

  _createFormatter: function () {
    this.formatter = formatter.formatNumber;

    if (this._isDateTimeSeries()) {
      this.formatter = formatter.timestampFactory(this._dataviewModel.get('aggregation'), this._dataviewModel.get('offset'), this._timeSeriesModel.get('local_timezone'));
    }
  },

  _isDateTimeSeries: function () {
    return this._dataviewModel.getColumnType() === 'date';
  },

  _updateXScale: function () {
    // calculate range based on the torque layer bounds (that are not the same than the histogram ones)
    var range = 1000 * (this._dataviewModel.get('end') - this._dataviewModel.get('start'));
    // get normalized start and end
    var start = (this._torqueLayerModel.get('start') - 1000 * this._dataviewModel.get('start')) / range;
    var end = (this._torqueLayerModel.get('end') - 1000 * this._dataviewModel.get('start')) / range;

    // This function might be called in-between state changes, so just to be safe let's keep the range sane
    var scaleRangeMin = (start * this._width()) + this._chartMargins.left;
    var scaleRangeMax = (end * this._width()) - this._chartMargins.right;

    scaleRangeMin = scaleRangeMin < 0
      ? this._chartMargins.left
      : scaleRangeMin;

    scaleRangeMax = scaleRangeMax > this._width()
      ? this._width() - this._chartMargins.right
      : scaleRangeMax;

    this._xScale = d3.scale.linear()
      .domain([0, this._torqueLayerModel.get('steps')])
      .range([scaleRangeMin, scaleRangeMax]);
  },

  _width: function () {
    return this._chartView.model.get('width');
  }
});
