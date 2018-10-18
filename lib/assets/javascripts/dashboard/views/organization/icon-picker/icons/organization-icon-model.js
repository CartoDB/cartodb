const Backbone = require('backbone');
const _ = require('underscore');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = Backbone.Model.extend({
  defaults: {
    selected: false,
    visible: false,
    deleted: false
  },

  fileAttribute: 'resource',

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  save: function (attrs, options = {}) {
    attrs = attrs || _.clone(this.attributes);

    attrs = _.omit(attrs, ['selected', 'visible', 'deleted']);
    options.data = JSON.stringify(attrs);

    return Backbone.Model.prototype.save.call(this, attrs, options);
  }
});
