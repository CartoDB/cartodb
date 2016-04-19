var cdb = require('cartodb.js');
var template = require('./popup-content-types.tpl');

/**
 * Select for a Widget definition type.
 */
module.exports = cdb.core.View.extend({

  events: {
    'change .js-select': '_onTypeChange'
  },

  initialize: function (opts) {
  },

  render: function () {
    this.$el.html(template());
    return this;
  },

  _onTypeChange: function (ev) {
    var newType = this.$('.js-select').val();
  }

});
