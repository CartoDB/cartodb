var cdb = require('cartodb.js');
var ViewFactory = require('../../../view_factory');

/**
 * Model for the Lon/Lat georeference option.
 */
module.exports = cdb.core.Model.extend({

  tabLabel: 'Lon/Lat Columns',

  initialize: function() {
  },

  createView: function() {
    return ViewFactory.createByTemplate('common/templates/loading', {
      title: 'Sorry, pending implementation! latitude column',
      quote: 'Poco a poco se anda lejos'
    });
  }
});
