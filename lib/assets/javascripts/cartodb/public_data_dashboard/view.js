var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({
  tagName: 'div',

  _LIMIT: 12,

  initialize: function() {
    this.maps = [];

    this._initTemplates();
    this._initModels();
    this._initBindings();
    this._fetchItems();
  },

  render: function() {
    this.$el.html(this.template(_.extend({
      order: null, // TODO
    })));

    return this;
  },

  _initTemplates: function() {
    this.template = cdb.templates.getTemplate('public_data_dashboard/template');
    this.loaderTemplatePath = 'explore/loading';
  },

  _initModels: function() {

  },

  _initBindings: function() {

  },

  _fetchItems: function(reset) {

  }

});
