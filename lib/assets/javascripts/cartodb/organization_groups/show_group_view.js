var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.make('div', {}, 'TBD')
    );
    return this;
  },

  _initBinds: function() {
  }
});
