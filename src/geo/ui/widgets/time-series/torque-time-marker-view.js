var d3 = require('d3');
var Model = require('cdb/core/model');
var View = require('cdb/core/view');

/**
 * Time-marker, expected to be used in a histogram view
 */
module.exports = View.extend({

  defaults: {
    width: 4,
    height: 8
  },

  initialize: function() {
    if (!this.options.model) throw new Error('model is required');
    if (!this.options.chartView) throw new Error('chartView is required');
    if (!this.options.torqueLayerModel) throw new Error('torqeLayerModel is required');

    this._chartView = this.options.chartView;
    this._torqueLayerModel = this.options.torqueLayerModel;
    this.viewModel = new Model();

    this._torqueLayerModel.bind('change:step', this._onChangeStep, this);
    this._torqueLayerModel.bind('change:steps', this._onChangeSteps, this);
    this._torqueLayerModel.bind('change:stepsRange', this._onStepsRange, this);
    this.add_related_model(this._torqueLayerModel);

    this._chartView.model.bind('change:width', this._onChangeChartWidth, this);
    this._chartView.model.bind('change:height', this._onChangeChartHeight, this);
    this.add_related_model(this._chartView.model);

    this._updateXScale();
  },

  render: function() {
    // Make the render call idempotent; only create time marker once
    if (!this.timeMarker) {
      var dragBehavior = d3.behavior.drag()
        .on('dragstart', this._onDragStart.bind(this))
        .on('drag', this._onDrag.bind(this))
        .on('dragend', this._onDragEnd.bind(this));

      this.timeMarker = this._chartView.canvas.append('rect')
        .attr('class', 'TimeMarker')
        .attr('width', this.defaults.width)
        .attr('height', this._calcHeight())
        .attr('rx', 3)
        .attr('ry', 3)
        .data([{ x: 0, y: 0 }])
        .attr('transform', this._translateXY)
        .call(dragBehavior);
    }

    return this;
  },

  clean: function() {
    if (this.timeMarker) {
      this.timeMarker.remove();
    }
    View.prototype.clean.call(this);
  },

  _onDragStart: function() {
    var isRunning = this._torqueLayerModel.get('isRunning');
    if (isRunning) {
      this._torqueLayerModel.pause();
    }
    this.viewModel.set({
      isDragging: true,
      wasRunning: isRunning
    });
  },

  _onDrag: function(d, i) {
    var nextX = d.x + d3.event.dx;
    if (this._isWithinRange(nextX)) {
      d.x = nextX;
      this.timeMarker.attr('transform', this._translateXY);

      var step = Math.round(this._xScale.invert(d.x));
      this._torqueLayerModel.setStep(step);
    }
  },

  _onDragEnd: function() {
    this.viewModel.set('isDragging', false);
    if (this.viewModel.get('wasRunning')) {
      this._torqueLayerModel.play();
    }
  },

  _translateXY: function(d) {
    return 'translate(' + [d.x, d.y] + ')';
  },

  _isWithinRange: function(x) {
    return x >= 0 && x <= this._width();
  },

  _onChangeStep: function() {
    // Time marker might not be created when this method is first called
    if (this.timeMarker && !this.viewModel.get('isDragging')) {
      var data = this.timeMarker.data();
      var newX = this._xScale(this._torqueLayerModel.get('step'));
      if (!isNaN(newX)) {
        data[0].x = newX;
        this.timeMarker
          .data(data)
          .transition()
          .ease('linear')
          .attr('transform', this._translateXY);
      }
    }
  },

  _onChangeSteps: function() {
    this._updateXScale();
  },

  _onStepsRange: function() {
    var r = this._torqueLayerModel.get('stepsRange');
    if (r.start === 0 && r.end === this.model.get('bins')) {
      this._chartView.removeSelection();
    } else {
      this._chartView.selectRange(r.start, r.end);
    }
  },

  _onChangeChartWidth: function() {
    this._updateXScale();
    this._onChangeStep();
  },

  _onChangeChartHeight: function() {
    this.timeMarker.attr('height', this._calcHeight());
  },

  _calcHeight: function() {
    return this._chartView.chartHeight() + this.defaults.height;
  },

  _updateXScale: function() {
    this._xScale = d3.scale.linear()
      .domain([0, this._torqueLayerModel.get('steps')])
      .range([0, this._width()]);
  },

  _width: function() {
    return this._chartView.model.get('width');
  }
});
