var CoreView = require('backbone/core-view');

/**
 *  Base layer analysis view.
 */
module.exports = CoreView.extend({

  tagName: 'li',

  attributes: function () {
    return {'data-analysis-node-id': this.model.id};
  },

  events: {
    'click': '_onClick'
  },

  _onClick: function (e) {
    this.trigger('nodeClicked', this.model, this);
  }

});
