var cdb = require('cartodb.js');
var template = require('./infowindow-fields.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    this._fields = opts.fields.models;
  },

  render: function () {
    this.$el.html(template({
      title: _t('editor.layers.infowindow.style.title-label'),
      description: _t('editor.layers.infowindow.style.description'),
      fields: this._fields
    }));
    return this;
  }

});
