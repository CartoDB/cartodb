const CoreView = require('backbone/core-view');
const template = require('./group.tpl');
const pluralizeStr = require('dashboard/helpers/pluralize');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'model',
  'url'
];

/**
 * View for an individual group.
 */
module.exports = CoreView.extend({
  tagName: 'li',
  className: 'OrganizationList-user',
  _PREVIEW_COUNT: 3,

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    const sharedMapsCount = this.model.get('shared_maps_count');
    const sharedDatasetsCount = this.model.get('shared_tables_count');

    this.$el.html(
      template({
        displayName: this.model.get('display_name'),
        sharedMapsCount: pluralizeStr('1 shared map', `${sharedMapsCount} shared maps`, sharedMapsCount),
        sharedDatasetsCount: pluralizeStr('1 shared dataset', `${sharedDatasetsCount} shared datasets`, sharedDatasetsCount),
        url: this._url,
        previewUsers: this.model.users.toArray().slice(0, this._PREVIEW_COUNT),
        usersCount: Math.max(this.model.users.length - this._PREVIEW_COUNT, 0)
      })
    );
    return this;
  }

});
