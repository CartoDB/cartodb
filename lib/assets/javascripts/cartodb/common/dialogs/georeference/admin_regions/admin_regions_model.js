var cdb = require('cartodb.js');
var ViewFactory = require('../../../view_factory');

/**
 * Model for the administrative regions georeference option.
 */
module.exports = cdb.core.Model.extend({

  tabLabel: 'Admin. Regions',

  initialize: function() {
  },

  createView: function() {
    return ViewFactory.createByTemplate('common/templates/loading', {
      title: 'Sorry, pending implementation!',
      quote: 'Poco a poco se anda lejos'
    });
  }
});
