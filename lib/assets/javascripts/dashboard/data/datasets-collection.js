const VisualizationsCollection = require('dashboard/data/visualizations-collection');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = VisualizationsCollection.extend({
  _ITEMS_PER_PAGE: 12,

  initialize: function (models, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    VisualizationsCollection.prototype.initialize.apply(this, arguments);
  },

  url: function () {
    const host = `${this._configModel.get('common_data_user')}.${this._configModel.get('account_host')}`;
    const options = this._createUrlOptions();

    return `//${host}/api/v1/viz/?${options}`;
  }
});
