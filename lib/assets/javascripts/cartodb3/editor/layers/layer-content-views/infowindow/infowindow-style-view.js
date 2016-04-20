var cdb = require('cartodb.js');
var template = require('./infowindow-style.tpl');

module.exports = cdb.core.View.extend({

  events: {
    'change .js-select': '_onTypeChange'
  },

  initialize: function (opts) {
  },

  render: function () {
    this.$el.html(template({
      title: _t('editor.layers.infowindow.style.title-label'),
      description: _t('editor.layers.infowindow.style.description')
    }));
    return this;
  },

  _onTypeChange: function (ev) {
    // TODO: persist
    // var newType = this.$('.js-select').val();
  }

});
