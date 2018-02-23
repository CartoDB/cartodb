const cdb = require('cartodb.js');
const Backbone = require('backbone');
const _ = require('underscore');
const checkAndBuildOpts = require('builder/helpers/required-opts');

/**
 *  Model that let user upload files
 *  to our endpoints
 *
 *  NOT MIGRATED; JUST COPIED FOR EXPERIMENT.
 */

require('backbone-model-file-upload');

const REQUIRED_OPTS = [
  'configModel',
  'userId'
];

module.exports = Backbone.Model.extend({
  url: function (method) {
    var version = this._configModel.urlVersion('asset', method);
    return `/api/${version}/users/${this._userId}/assets`;
  },

  fileAttribute: 'filename',

  initialize: function (attributes, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  }
});
