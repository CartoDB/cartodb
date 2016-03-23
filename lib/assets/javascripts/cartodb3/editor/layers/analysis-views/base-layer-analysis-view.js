var cdb = require('cartodb-deep-insights.js');

/**
 *  Base layer analysis view.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click': '_onNodeClicked'
  },

  className: 'js-analysis',

  _onNodeClicked: function (e) {
    e.stopPropagation();
    this.trigger('nodeClicked', this.model.id, this);
  }

});
