var _ = require('underscore');
var Backbone = require('backbone');

/**
 * Model that represents a visualization export (v3)
 */

module.exports = Backbone.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');

    this._configModel = opts.configModel;
    this._visDefinitionModel = opts.visDefinitionModel;
  },

  urlRoot: function () {
    return this._visDefinitionModel.exportsURL();
  }
});
