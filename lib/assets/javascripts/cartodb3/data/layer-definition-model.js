var cdb = require('cartodb.js');
var _ = require('underscore');
var nodeIds = require('./analysis-definition-node-ids.js');
var layerTypesAndKinds = require('./layer-types-and-kinds');
var InfowindowDefinitionModel = require('./infowindow-definition-model');

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

    // InfowindowDefinitionModel => Infowindow model in CartoDB.js
    if (r.infowindow) {
      if (!this.infowindowModel) {
        this.infowindowModel = new InfowindowDefinitionModel(r.infowindow, {
          configModel: opts.configModel || this._configModel
        });
      }
    }
    if (r.tooltip) {
      if (!this.tooltip) {
        this.tooltipModel = new InfowindowDefinitionModel(r.tooltip, {
          configModel: opts.configModel || this._configModel
        });
      }
    }

    // Flatten the rest of the attributes
    return attrs;
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

    this.on('change:source', this._onSourceChanged, this);

    if (this.infowindowModel) {
      this.infowindowModel.bind('change', _.debounce(function () {
        this.save();
      }, 20), this);
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

    var d = {
      kind: layerTypesAndKinds.getKind(this.get('type')),
      options: options
    };

    if (this.infowindowModel) {
      d.infowindow = this.infowindowModel.toJSON();
    }

    if (this.tooltipModel) {
      d.tooltip = this.tooltipModel.toJSON();
    }

    return _.defaults(
      d,
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
  },

  getAnalysisDefinitionNodeModel: function () {
    return this.collection.findAnalysisDefinitionNodeModel(this.get('source'));
  },

  _onSourceChanged: function () {
    if (this.infowindowModel) {
      this.infowindowModel.clearFields();
    }
  }

});
