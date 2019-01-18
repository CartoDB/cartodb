var Backbone = require('backbone');

/**
 *  Stack layout model checks and decides if next or previous
 *  positions are possible.
 */

module.exports = Backbone.Model.extend({

  defaults: {
    position: 0
  },

  initialize: function (attrs, opts) {
    this.stackLayoutItems = opts.stackLayoutItems;
  },

  goToStep: function (position) {
    var stackLayoutItemsSize = this.stackLayoutItems.size();

    if (position >= stackLayoutItemsSize) {
      throw new Error('There is no ' + position + ' stack view in the collection');
    } else {
      this.set({
        position: position
      }, {
        silent: true
      });
      this._rememberStep.apply(this, arguments);
      this._triggerPositionChanged(position, Array.prototype.slice.call(arguments, 1));
    }
  },

  nextStep: function () {
    var currentPos = this.get('position');
    var nextPosition = ++currentPos;
    this.goToStep.apply(this, Array.prototype.concat.apply([nextPosition], arguments));
  },

  prevStep: function () {
    var currentPos = this.get('position');
    var prevPosition = --currentPos;
    this.goToStep.apply(this, Array.prototype.concat.apply([prevPosition], arguments));
  },

  goBack: function () {
    if (this._goBackToArguments) {
      this.goToStep.apply(this, this._goBackToArguments);
    }
  },

  _triggerPositionChanged: function (position, args) {
    this.trigger('positionChanged', position, Array.prototype.slice.call(args));
  },

  _rememberStep: function () {
    this._goBackToArguments = this._lastStepArguments || [ 0 ];
    this._lastStepArguments = arguments;
  }
});
