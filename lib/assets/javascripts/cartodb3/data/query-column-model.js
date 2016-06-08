var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  url: function () {
    if (this._tableName) {
      var baseUrl = this._configModel.get('base_url');
      var version = this._configModel.urlVersion('column');
      return baseUrl + '/api/' + version + '/tables/' + this._tableName + '/columns';
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

    this._tableName = opts.tableName;
    this._configModel = opts.configModel;
  }

});
