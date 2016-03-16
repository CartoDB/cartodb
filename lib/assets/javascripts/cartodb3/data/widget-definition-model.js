var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');

var ATTRS_AT_TOP_LEVEL = ['id', 'layer_id', 'title', 'type', 'order'];

/**
 * Widget definition Model
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.mapId) throw new Error('mapId is required');

    this._configModel = opts.configModel;
    this._mapId = opts.mapId;
  },

  urlRoot: function () {
    // Since widget are stored under layers the collection can't figure out the URL by itself,
    // thus each widget sets its own urlRoot
    var baseUrl = this._configModel.get('base_url');
    var layerId = this.get('layer_id');
    return baseUrl + '/api/v3/maps/' + this._mapId + '/layers/' + layerId + '/widgets';
  },

  /**
   * The API response format is a little bit different, and may
   * @param {Object} r API response
   * @return {Object} attrs to be set on model
   */
  parse: function (r) {
    return _.defaults(
      _.omit(r, ['options']),
      r.options,
      {
        // Set some default values if not already provided in the response
        sync_on_data_change: true,
        sync_on_bbox_change: true
      }
    );
  },

  /**
   * @override Backbone.Model.prototype.toJSON
   * Formats the JSON to match the server-side API
   */
  toJSON: function () {
    return _.defaults(
      _.pick(this.attributes, ATTRS_AT_TOP_LEVEL),
      {
        options: _.omit(this.attributes, ATTRS_AT_TOP_LEVEL)
      }
    );
  },

  updateOrder: function (index) {
    this.save({
      order: index
    });
  },

  changeType: function (type) {
    var attrsForNewType = _
      .defaults(
        { type: type },
        this.collection.attrsForThisType(type, this)
      );

    // Unset now irrelevant attributes due to the type change
    _
      .chain(this.attributes)
      .keys()
      .difference(
        ['sync_on_data_change', 'sync_on_bbox_change'].concat(ATTRS_AT_TOP_LEVEL),
        _.keys(attrsForNewType)
      )
      .each(function (key) {
        this.unset(key, { silent: true });
      }, this);

    this.set(attrsForNewType);
  }
});
