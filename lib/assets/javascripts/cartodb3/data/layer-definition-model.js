var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');
var TableModel = require('../data/table-model');

var OWN_ATTR_NAMES = ['id', 'kind', 'order'];

/**
 * Model to edit a layer definition.
 * Should always exist as part of a LayerDefinitionsCollection, so its URL is given from there.
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

    // Optional; Might not exist yet, e.g. for a new layer definition it should not be created until layer is persisted.
    this.layerModel = opts.layerModel;
  },

  parse: function (r, opts) {
    r.options = r.options || {};

    // Flatten the attrs, to avoid having this.get('options').foobar internally
    var attrs = _
      .chain(r)
      .pick(OWN_ATTR_NAMES)
      .extend(r.options)
      .value();

    // TODO create actual value objects for these representations
    this._infowindow = r.infowindow;
    this._tooltip = r.tooltip;

    var tableName = r.options.table_name;
    if (tableName && !this.tableModel) {
      this.tableModel = new TableModel({
        name: tableName
      }, {
        configModel: opts.configModel || this._configModel
      });
    }

    // Flatten the rest of the attributes
    return attrs;
  },

  toJSON: function () {
    // Un-flatten the internal attrs to the datastructure that's expected by the API endpoint
    var d = _.pick(this.attributes, OWN_ATTR_NAMES);
    d.infowindow = this._infowindow;
    d.options = _.omit(this.attributes, OWN_ATTR_NAMES);
    d.tooltip = this._tooltip;

    return d;
  },

  getName: function () {
    return this.get('table_name_alias') || this.get('table_name') || this.get('name');
  }
});
