var Backbone = require('backbone');
var GroupModel = require('./group-model');

/**
 * Collection of a User's groups.
 */
module.exports = Backbone.Collection.extend({
  model: GroupModel,

  initialize: function (models, opts) {
    this.organization = opts.organization;
  }
});
