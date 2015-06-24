var cdb = require('cartodb.js');
var ViewFactory = require('../../../view_factory');

/**
 * Model for the IP addresses georeference option.
 */
module.exports = cdb.core.Model.extend({

  tabLabel: 'IP Addresses',

  initialize: function() {
  },

  createView: function() {
    return ViewFactory.createByTemplate('common/templates/loading', {
      title: 'Sorry, pending implementation!',
      quote: 'Poco a poco se anda lejos'
    });
  }
});
