var Backbone = require('backbone');

/**
 *  Organization info model
 *
 */
module.exports = Backbone.Collection.extend({

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('visualization');
    return baseUrl + '/api/' + version + '/users/' + this._currentUserId + '/layers';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.currentUserId) throw new Error('currentUserId is required');

    this._configModel = opts.configModel;
    this._currentUserId = opts.currentUserId;
  },

  custom: function () {
    return this.where({ category: undefined });
  }

});
