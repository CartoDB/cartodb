var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 *  Stack layout model checks and decides if next or previous
 *  positions are possible.
 */

module.exports = cdb.core.Model.extend({

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
      this._triggerPositionChanged(position, Array.prototype.slice.call(arguments, 1));
    }
  },

  nextStep: function () {
    var currentPos = this.get('position');
    var stackLayoutItemsSize = this.stackLayoutItems.size();
    var nextPosition = ++currentPos;

    var errorMsg;
    if (nextPosition >= stackLayoutItemsSize) {
      errorMsg = 'Already on last stack position! Staying on last step, but the caller should probably be using goToStep instead';
    }

    nextPosition = stackLayoutItemsSize - 1;
    this.set({position: nextPosition}, {silent: true});
    this._triggerPositionChanged(nextPosition, arguments);

    if (errorMsg) {
      _.defer(function () {
        throw new Error(errorMsg);
      });
    }
  },

  prevStep: function () {
    var currentPos = this.get('position');
    var prevPos = --currentPos;

    if (prevPos < 0) {
      throw new Error('There is no ' + prevPos + ' stack view in the collection');
    } else {
      this.set({
        position: prevPos
      }, {
        silent: true
      });
      this._triggerPositionChanged(prevPos, arguments);
    }
  },

  _triggerPositionChanged: function (position, args) {
    this.trigger('positionChanged', position, Array.prototype.slice.call(args));
  }

});
