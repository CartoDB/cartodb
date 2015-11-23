var d3 = require('d3');
var View = require('cdb/core/view');

/**
 * Time-marker, expected to be used in a histogram view
 */
module.exports = View.extend({

  initialize: function() {
    if (!this.options.chartCanvas) throw new Error('chartCanvas is required');
    if (!this.options.viewModel) throw new Error('viewModel is required');
    if (!this.options.torqueLayerModel) throw new Error('torqeLayerModel is required');

    this._chartCanvas = this.options.chartCanvas;
    this._viewModel = this.options.viewModel;
    this._torqueLayerModel = this.options.torqueLayerModel;

    this._torqueLayerModel.bind('change:step', this._updatePosition, this);
    this.add_related_model(this._torqueLayerModel);

    this._viewModel.bind('change:histogramChartWidth', this._updateXScale, this);
    this.add_related_model(this._viewModel);
    this._updateXScale();
  },

  render: function() {
    // Make the render call idempotent; only create time marker once
    if (!this._timeMarker) {
      var dragBehavior = d3.behavior.drag()
        .on('dragstart', this._onDragStart.bind(this))
        .on('drag', this._onDrag.bind(this))
        .on('dragend', this._onDragEnd.bind(this));

      var margins = this._viewModel.get('histogramChartMargins');
      var height = this._viewModel.get('histogramChartHeight') - margins.top - margins.bottom + 8;

      this._timeMarker = this._chartCanvas.append('rect')
        .attr('class', 'TimeMarker')
        .attr('width', 4)
        .attr('height', height)
        .attr('rx', 3)
        .attr('ry', 3)
        .data([{ x: 0, y: 0 }])
        .attr('transform', this._translateXY)
        .call(dragBehavior);
    }

    return this;
  },

  clean: function() {
    if (this._timeMarker) {
      this._timeMarker.remove();
    }
    View.prototype.clean.call(this);
  },

  _onDragStart: function() {
    var isRunning = this._torqueLayerModel.get('isRunning');
    if (isRunning) {
      this._torqueLayerModel.pause();
    }
    this._viewModel.set({
      isDragging: true,
      wasRunning: isRunning
    });
  },

  _onDrag: function(d, i) {
    var nextX = d.x + d3.event.dx;
    if (this._isWithinRange(nextX)) {
      d.x = nextX;
      this._timeMarker.attr('transform', this._translateXY);

      var step = Math.round(this._xScale.invert(d.x));
      this._torqueLayerModel.setStep(step);
    }
  },

  _onDragEnd: function() {
    this._viewModel.set('isDragging', false);
    if (this._viewModel.get('wasRunning')) {
      this._torqueLayerModel.play();
    }
  },

  _translateXY: function(d) {
    return 'translate(' + [d.x, d.y] + ')';
  },

  _isWithinRange: function(x) {
    return 0 <= x && x <= this._viewModel.get('histogramChartWidth');
  },

  _updatePosition: function(m, step) {
    // Time marker might not be created yet, when this method is first called
    if (this._timeMarker && !this._viewModel.get('isDragging')) {
      var data = this._timeMarker.data();
      data[0].x = this._xScale(step);

      this._timeMarker
        .data(data)
        .transition()
        .ease('linear')
        .attr('transform', function(d) {
          return 'translate(' + [d.x, d.y] + ')';
        });
    }
  },

  _updateXScale: function() {
    this._xScale = d3.scale.linear()
      .domain([0, this._torqueLayerModel.get('steps')])
      .range([0, this._viewModel.get('histogramChartWidth')]);
  }
});
