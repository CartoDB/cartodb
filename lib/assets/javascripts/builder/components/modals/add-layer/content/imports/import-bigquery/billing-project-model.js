const Backbone = require('backbone');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = Backbone.Model.extend({
  defaults: {
    projects: []
  },

  url: function () {
    const version = this._configModel.urlVersion('connectors');
    const baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/' + version + '/connectors/bigquery/projects';
  },

  parse: function (response, options) {
    this.set('projects', response);
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  }
});
