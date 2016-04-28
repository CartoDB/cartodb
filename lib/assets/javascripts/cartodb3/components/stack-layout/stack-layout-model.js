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

  nextStep: function () {
    var currentPos = this.get('position');
    var stackLayoutItemsSize = this.stackLayoutItems.size();
    var nextPos = ++currentPos;

    if (nextPos >= stackLayoutItemsSize) {
      throw new Error('There is no ' + nextPos + ' stack view in the collection');
    } else {
      this.set({
        position: nextPos
      }, {
        silent: true
      });
      this.trigger('positionChanged', nextPos, arguments);
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
      this.trigger('positionChanged', prevPos, arguments);
    }
  }

});
