const Backbone = require('backbone');
const GroupModel = require('dashboard/data/group-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = Backbone.Collection.extend({

  model: function (attrs, { collection }) {
    return new GroupModel(attrs, {
      collection,
      configModel: collection._configModel
    });
  },

  initialize: function (models, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this.organization = opts.organization;
  }

});
