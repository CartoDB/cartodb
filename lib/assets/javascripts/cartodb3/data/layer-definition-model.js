var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');
var LayerTableModel = require('./layer-table-model');
var nodeIds = require('./analysis-definition-node-ids.js');

var OWN_ATTR_NAMES = ['id', 'kind', 'order', 'table_name_alias'];

/**
 * Model to edit a layer definition.
 * Should always exist as part of a LayerDefinitionsCollection, so its URL is given from there.
 */
module.exports = cdb.core.Model.extend({
  parse: function (r, opts) {
    r.options = r.options || {};

    // Flatten the attrs, to avoid having this.get('options').foobar internally
    var attrs = _
      .defaults(
        _.pick(r, OWN_ATTR_NAMES),
        _.omit(r.options, ['table_name', 'query'])
    );

    var tableName = r.options.table_name;
    if (tableName) {
      var query = r.options.query;

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

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
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

    var json = _.defaults(
      _.pick(this.attributes, OWN_ATTR_NAMES),
      { options: options }
    );

    return json;
  },

  hasAnalysisNode: function (nodeModel) {
    return this.get('letter') === nodeIds.letter(nodeModel);
  },

  getName: function () {
    return this.get('name') ||
    this.get('table_name_alias') ||
    (this.layerTableModel && this.layerTableModel.get('table_name'));
  },

  getTableName: function () {
    return (this.layerTableModel && this.layerTableModel.get('table_name')) || '';
  }

});
