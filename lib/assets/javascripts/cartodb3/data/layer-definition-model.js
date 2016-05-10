var cdb = require('cartodb.js');
var _ = require('underscore');
var StyleDefinitionModel = require('../editor/style/style-definition-model');
var nodeIds = require('./analysis-definition-node-ids.js');
var layerTypesAndKinds = require('./layer-types-and-kinds');

var OWN_ATTR_NAMES = ['id', 'infowindow', 'order', 'table_name_alias', 'tooltip'];

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
        _.omit(r.options, ['query', 'tile_style'])
    );

    // Only use type on the frontend, it will be mapped back when the model is serialized (see .toJSON)
    attrs.type = attrs.type || layerTypesAndKinds.getType(r.kind);

    // Map API endpoint attrs to the new names used client-side (cartodb.js in particular)
    if (r.options.tile_style) {
      attrs.cartocss = r.options.tile_style;
    }
    if (r.options.query) {
      attrs.sql = r.options.query;
    }

    // Flatten the rest of the attributes
    return attrs;
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

    if (this.get('table_name')) {
      this._styleModel = new StyleDefinitionModel(this.get('wizard_properties'), {
        parse: true
      });
    }
  },

  toJSON: function () {
    // Un-flatten the internal attrs to the datastructure that's expected by the API endpoint
    var options = _.omit(this.attributes, OWN_ATTR_NAMES.concat(['cartocss', 'sql']));

    // Map back internal attrs to the expected attrs names by the API endpoint
    var cartocss = this.get('cartocss');
    if (cartocss) {
      options.tile_style = cartocss;
    }
    var sql = this.get('sql');
    if (sql) {
      options.query = sql;
    }

    return _.defaults(
      {
        kind: layerTypesAndKinds.getKind(this.get('type')),
        options: options
      },
      _.pick(this.attributes, OWN_ATTR_NAMES)
    );
  },

  hasAnalysisNode: function (nodeModel) {
    return this.get('letter') === nodeIds.letter(nodeModel);
  },

  getName: function () {
    return this.get('name') ||
    this.get('table_name_alias') ||
    this.get('table_name');
  },

  getTableName: function () {
    return this.get('table_name') || '';
  },

  createNewAnalysisNode: function (nodeAttrs) {
    return this.collection.createNewAnalysisNode(this, nodeAttrs);
  }

});
