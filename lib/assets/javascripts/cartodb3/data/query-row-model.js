var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  url: function () {
    if (this._tableName) {
      var baseUrl = this._configModel.get('base_url');
      var version = this._configModel.urlVersion('record');
      return baseUrl + '/api/' + version + '/tables/' + this._tableName + '/records';
    }

    return false;
  },

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._tableName = opts.tableName;
    this._configModel = opts.configModel;
  }

});
