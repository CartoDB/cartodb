var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var Backbone = require('backbone');

/**
 * Model that represents a visualization (v3)
 *
 * Even though a table might be represented as a Visualization in some cases, please use TableModel if you want to work
 * with the table data instead of adding table-specific methods here.
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.mapDefinitionModel) throw new Error('mapDefinitionModel is required');

    this._configModel = opts.configModel;

    this.mapDefinitionModel = opts.mapDefinitionModel;

    // The widgets collection has no own logic, so use plain collection for now
    // Also the widget model needs to construct their own URLs, so no need to pass baseUrl here
    this.widgetDefinitionsCollection = new Backbone.Collection();
  },

  urlRoot: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('visualization');
    return baseUrl + '/api/' + version + '/viz';
  }

});
