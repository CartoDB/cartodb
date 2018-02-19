const Backbone = require('backbone');
const GroupModel = require('dashboard/data/group-model');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = Backbone.Collection.extend({

  model: GroupModel,

  initialize: function (models, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this.organization = opts.organization;
  }

});
