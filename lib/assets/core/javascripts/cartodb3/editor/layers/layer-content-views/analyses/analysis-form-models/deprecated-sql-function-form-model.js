var cdb = require('cartodb.js');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var checkAndBuildOpts = require('../../helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel'
];

module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._SQL = new cdb.SQL({
      user: this._configModel.get('user_name'),
      sql_api_template: this._configModel.get('sql_api_template'),
      api_key: this._configModel.get('api_key')
    });

    this._fetchAvailableFunctions();
  },

  _fetchAvailableFunctions: function () {

  }
});
