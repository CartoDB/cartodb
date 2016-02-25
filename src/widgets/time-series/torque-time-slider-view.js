var d3 = require('d3');
var cdb = require('cartodb.js');

/**
 * Time-slider, expected to be used in a histogram view
 */
module.exports = cdb.core.View.extend({
  defaults: {
    width: 4,
    height: 8
  },

  initialize: function () {
    if (!this.options.chartView) throw new Error('chartView is required');
    if (!this.options.torqueLayerModel) throw new Error('torqeLayerModel is required');

    this.model = new cdb.core.Model();

    this._dataviewModel = this.options.dataviewModel;
    this._chartView = this.options.chartView;
    this._torqueLayerModel = this.options.torqueLayerModel;

    this._torqueLayerModel.bind('change:start change:end', this._updateChartandTimeslider, this);
    this._torqueLayerModel.bind('change:step', this._onChangeStep, this);
    this._torqueLayerModel.bind('change:steps', this._updateChartandTimeslider, this);

    this.add_related_model(this._torqueLayerModel);

    this._chartView.model.bind('change:width', this._updateChartandTimeslider, this);
    this._chartView.model.bind('change:height', this._onChangeChartHeight, this);
    this.add_related_model(this._chartView.model);

    this._dataviewModel.on('change:bins', this._updateChartandTimeslider, this);
    this.add_related_model(this._dataviewModel);

    this._dataviewModel.filter.on('change:min change:max', this._onFilterMinMaxChange, this);
    this.add_related_model(this._dataviewModel.filter);

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

    return this;
  },

  clean: function () {
    if (this.timeSlider) {
      this.timeSlider.remove();
    }
    cdb.core.View.prototype.clean.call(this);
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
    return x >= 0 && x <= this._width();
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

  _onFilterMinMaxChange: function (m, isFiltering) {
    this.$el.toggle(!isFiltering);
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
      .range([start * this._width(), end * this._width()]);
  },

  _width: function () {
    return this._chartView.model.get('width');
  }
});
