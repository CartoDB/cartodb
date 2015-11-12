var Model = require('cdb/core/model');

/**
 * Model to bridge from a Torque layer model to the context of a time widget.
 * Mostly proxy data and events to the expected format
 */
module.exports = Model.extend({

  defaults: {
    isRunning: false,
    stepDate: undefined, // Date
    timePerStep: undefined, // Number, calculatd from torque layer's timeBounds
    data: undefined // generated from torque layer's attrs
  },

  initialize: function(attrs, opts) {
    this.torqueLayerModel = opts.torqueLayerModel;
    this.torqueLayerModel.bind('change:timeBounds change:steps', this._onChangeTorqueData, this);
    this.torqueLayerModel.bind('change:step', this._updateStepDate, this);
    this.torqueLayerModel.bind('change:isRunning', this._onChangeIsRunning, this);
    this._onChangeTorqueData();
  },

  play: function() {
    this.torqueLayerModel.play();
  },

  pause: function() {
    this.torqueLayerModel.pause();
  },

  _onChangeTorqueData: function() {
    this._updateTimePerStep();
    this._updateStepDate();
    this._updateData();
  },

  _onChangeIsRunning: function(m, isRunning) {
    this.set('isRunning', isRunning);
  },

  _updateTimePerStep: function() {
    var tb = this.torqueLayerModel.get('timeBounds');
    this.set('timePerStep', tb.end - tb.start / this.torqueLayerModel.get('steps'));
  },

  _updateStepDate: function() {
    this.set('stepDate', new Date(
      this._stepToTime(this.torqueLayerModel.get('step'))
    ));
  },

  _updateData: function() {
    var tb = this.torqueLayerModel.get('timeBounds');
    var steps = this.torqueLayerModel.get('steps');

    if (tb && steps > 0) {
      var data = [];
      var timePerStep = this.get('timePerStep');

      for (var i = 0; i < steps; i++) {
        var startTime = tb.start + i*timePerStep;
        data.push({
          start: new Date(startTime),
          end: new Date(startTime + timePerStep),
          freq: Math.floor(Math.random() * 42) // TODO what is the freq value supposed to represent for this context?
        });
      }

      this.set('data', data);
    }
  },

  _stepToTime: function(step) {
    return this.torqueLayerModel.get('timeBounds').start + step*this.get('timePerStep');
  }

});
