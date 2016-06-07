var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  url: function () {
    var tableName = this._analysisDefinitionNodeModel.get('table_name');

    if (tableName) {
      var baseUrl = this._configModel.get('base_url');
      var version = this._configModel.urlVersion('column');
      return baseUrl + '/api/' + version + '/tables/' + this._analysisDefinitionNodeModel.get('table_name') + '/columns';
    }

    return false;
  },

  parse: function (attrs) {
    return {
      name: attrs.name,
      type: attrs.cartodb_type || attrs.type
    };
  },

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');

    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;
    this._configModel = opts.configModel;
  }

});
