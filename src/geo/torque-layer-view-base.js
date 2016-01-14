var _ = require('underscore');

/**
 * Implementation of all common logic of a torque-layer view.
 * Should be extended on an implementing model.
 * All the methods and attributes here need to be consistent across all implementing models!
 */
module.exports = {

  _init: function (model) {
    this.on('tilesLoaded', function () {
      this.trigger('load');
    }, this);

    this.on('tilesLoading', function () {
      this.trigger('loading');
    }, this);

    this.on('change:time', function (changes) {
      this._setModelAttrs({
        step: changes.step,
        time: changes.time,
        renderRange: {
          start: changes.start,
          end: changes.end
        }
      });
    }, this);

    this.on('change:steps', function (changes) {
      this._setModelAttrs({ steps: changes.steps });
    }, this);

    this.on('play', function () {
      this._callModel('play');
    });

    this.on('pause', function () {
      this._callModel('pause');
    });

    this.model.set({
      isRunning: this.isRunning(),
      time: this.getTime(),
      step: this.getStep(),
      steps: this.model.get('torque-steps') || (this.provider && this.provider.getSteps()) || this.options.steps || 0
    });

    this._onModel();
  },

  /**
   * Set model property but unon changes first in order to not create an infinite loop
   */
  _setModelAttrs: function (attrs) {
    this._unonModel();
    this.model.set(attrs);
    this._onModel();
  },

  _callModel: function (method) {
    this._unonModel();
    var args = Array.prototype.slice.call(arguments, 1);
    this.model[method].apply(this.model, args);
    this._onModel();
  },

  _onModel: function () {
    this._unonModel();
    this.listenTo(this.model, 'change:isRunning', this._isRunningChanged);
    this.listenTo(this.model, 'change:time', this._timeChanged);
    this.listenTo(this.model, 'change:step', this._stepChanged);
    this.listenTo(this.model, 'change:steps', this._stepsChanged);
    this.listenTo(this.model, 'change:renderRange', this._renderRangeChanged);
  },

  _unonModel: function () {
    this.stopListening(this.model, 'change:isRunning', this._isRunningChanged);
    this.stopListening(this.model, 'change:time', this._timeChanged);
    this.stopListening(this.model, 'change:step', this._stepChanged);
    this.stopListening(this.model, 'change:steps', this._stepsChanged);
    this.stopListening(this.model, 'change:renderRange', this._renderRangeChanged);
  },

  _isRunningChanged: function (m, isRunning) {
    if (isRunning) {
      this.play();
    } else {
      this.pause();
    }
  },

  _timeChanged: function (m, time) {
    this.setStep(this.timeToStep(time));
  },

  _stepChanged: function (m, step) {
    this.setStep(step);
  },

  _stepsChanged: function (m, steps) {
    this.setSteps(steps);
  },

  _renderRangeChanged: function (m, r) {
    if (_.isObject(r) && _.isNumber(r.start) && _.isNumber(r.end)) {
      this.renderRange(r.start, r.end);
    } else {
      this.resetRenderRange();
    }
  }
};
