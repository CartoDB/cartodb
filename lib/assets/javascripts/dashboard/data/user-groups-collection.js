const Backbone = require('backbone');
const GroupModel = require('dashboard/data/group-model');

module.exports = Backbone.Collection.extend({

  model: GroupModel,

  initialize: function (models, opts) {
    this.organization = opts.organization;
  }

});
