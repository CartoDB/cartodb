var _ = require('underscore');
var cdb = require('cartodb.js');
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
    if (!opts.baseUrl) throw new Error('baseUrl is required');
    if (!opts.mapDefinitionModel) throw new Error('mapDefinitionModel is required');

    this._configModel = opts.configModel;
    this._baseUrl = opts.baseUrl;

    this.mapDefinitionModel = opts.mapDefinitionModel;

    // The widgets collection has no own logic, so use plain collection for now
    // Also the widget model needs to construct their own URLs, so no need to pass baseUrl here
    this.widgetDefinitionsCollection = new Backbone.Collection();
  },

  urlRoot: function () {
    var version = this._configModel.urlVersion('visualization');
    return _.result(this, '_baseUrl') + '/api/' + version + '/viz';
  }

});
