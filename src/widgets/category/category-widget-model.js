var WidgetModel = require('../widget-model');

/**
 * Model for a category widget
 */
module.exports = WidgetModel.extend({

  defaults: {
    title: '',
    search: false
  },

  toggleSearch: function () {
    this.set('search', !this.get('search'));
  },

  enableSearch: function () {
    this.set('search', true);
  },

  disableSearch: function () {
    this.set('search', false);
  },

  isSearchEnabled: function () {
    return this.get('search');
  }

});
