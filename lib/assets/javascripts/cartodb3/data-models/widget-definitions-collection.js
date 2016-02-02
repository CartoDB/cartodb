var Backbone = require('backbone');

/**
 * Collection of widget definitions.
 */
module.exports = Backbone.Collection.extend({

  url: function () {
    throw new Error('creator of this collection should define the URL');
  }

});
