var cdb = require('cartodb.js');
var Backbone = require('backbone');

/**
 * View model for the add-custom-basemap view
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    tabs: undefined,
    currentTab: 'xyz'
  },

  initialize: function() {
    this._initTabs();
  },

  _initTabs: function() {
    this.set('tabs', new Backbone.Collection([{
      name: 'xyz',
      label: 'XYZ'
    }]));
  }
});
