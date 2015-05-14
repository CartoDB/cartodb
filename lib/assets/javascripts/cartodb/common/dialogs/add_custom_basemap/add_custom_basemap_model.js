var cdb = require('cartodb.js');
var Backbone = require('backbone');
var XYZModel = require('./xyz_model.js');

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
    var tabs = new Backbone.Collection([
      new XYZModel()
    ]);

    this.set({
      tabs: tabs,
      currentTab: tabs.first().get('name')
    });
  }
});
