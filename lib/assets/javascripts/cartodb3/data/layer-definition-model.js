var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');
var LayerTableModel = require('./layer-table-model');

var OWN_ATTR_NAMES = ['id', 'kind', 'order', 'table_name_alias'];

/**
 * Model to edit a layer definition.
 * Should always exist as part of a LayerDefinitionsCollection, so its URL is given from there.
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
  },

  parse: function (r, opts) {
    // Flatten the attrs, to avoid having this.get('options').foobar internally
    var attrs = _
      .defaults(
        _.pick(r, OWN_ATTR_NAMES),
        _.omit(r.options, ['table_name', 'query'])
      );
    // TODO create actual value objects for these representations, not needed just yet though
    this._infowindow = r.infowindow;
    this._tooltip = r.tooltip;

    var responseOpts = r.options || {};
    var tableName = responseOpts.table_name;
    if (tableName) {
      var query = responseOpts.query;

      if (!this.layerTableModel) {
        this.layerTableModel = new LayerTableModel({
          table_name: tableName,
          query: query
        }, {
          configModel: opts.configModel || this._configModel
        });
      }

      this.layerTableModel.set({
        table_name: tableName,
        query: query
      });
    }

    // Flatten the rest of the attributes
    return attrs;
  },

  toJSON: function () {
    var options = {};

    // Maintain table_name+query props if available for backward compability
    if (this.layerTableModel) {
      options.table_name = this.layerTableModel.get('table_name');
      options.query = this.layerTableModel.get('query');
    }

    // Un-flatten the internal attrs to the datastructure that's expected by the API endpoint
    _.defaults(options, _.omit(this.attributes, OWN_ATTR_NAMES));

    return _.defaults(
      {
        infowindow: this._infowindow,
        tooltip: this._tooltip,
        options: options
      },
      _.pick(this.attributes, OWN_ATTR_NAMES)
    );
  },

  getName: function () {
    return this.get('table_name_alias') ||
      (this.layerTableModel && this.layerTableModel.get('table_name')) ||
      this.get('name');
  }

});
