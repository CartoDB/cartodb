const Backbone = require('backbone');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel'
];
const GRANT_TYPES = {
  APIS: 'apis',
  DATABASE: 'database'
};

module.exports = Backbone.Model.extend({
  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  url: function () {
    return `${this._userModel.get('base_url')}/api/v3/api_keys${this.get('id')}`;
  },

  getApiGrants: function () {
    const apiGrant = this.get('grants').find(grant => grant.type === GRANT_TYPES.APIS);

    return apiGrant ? apiGrant.apis : [];
  }
});
