var _ = require('underscore');
var cdb = require('cartodb.js');
var syncAbort = require('./backbone/sync-abort');

var ATTRS_AT_TOP_LEVEL = ['id', 'layer_id', 'source', 'title', 'type', 'order'];

/**
 * Widget definition Model
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    sync_on_data_change: true,
    sync_on_bbox_change: true
  },

  /**
   * @override {Backbone.prototype.sync} abort ongoing request if there is any
   */
  sync: syncAbort,

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
    var attrs = _.defaults(
      _.pick(r, ATTRS_AT_TOP_LEVEL),
      r.options
    );

    attrs.source = attrs.source && attrs.source.id;

    return attrs;
  },

  /**
   * @override Backbone.Model.prototype.toJSON
   * Formats the JSON to match the server-side API
   */
  toJSON: function () {
    var o = _.pick(this.attributes, ATTRS_AT_TOP_LEVEL);
    o.source = {id: this.get('source')};
    o.options = _.omit(this.attributes, ATTRS_AT_TOP_LEVEL);
    return o;
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
