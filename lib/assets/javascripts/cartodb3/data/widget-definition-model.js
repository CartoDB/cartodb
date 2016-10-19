var _ = require('underscore');
var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');
var ATTRS_AT_TOP_LEVEL = ['id', 'layer_id', 'source', 'title', 'type', 'order'];
var STYLE_PROPERTIES = ['widget_style_definition', 'auto_style_definition', 'auto_style_allowed'];
var WIDGET_STYLE = {
  color: {
    fixed: '#9DE0AD',
    opacity: 1
  }
};
var AUTO_STYLE = {
  'numeric': {
    color: {
      quantification: 'quantiles',
      bins: 7,
      range: ['#5B3F95', '#1D6996', '#129C63', '#73AF48', '#EDAD08', '#E17C05', '#C94034', '#BA0040', '#8E1966', '#6F3072', '#DC1721']
    }
  },
  'category': {
    color: {
      quantification: 'quantiles',
      bins: 7,
      range: ['#5B3F95', '#1D6996', '#129C63', '#73AF48', '#EDAD08', '#E17C05', '#C94034', '#BA0040', '#8E1966', '#6F3072', '#DC1721']
    }
  }
};

/**
 * Widget definition Model
 */
module.exports = Backbone.Model.extend({

  defaults: {
    sync_on_data_change: true,
    sync_on_bbox_change: true,
    widget_style_definition: WIDGET_STYLE,
    auto_style_allowed: true
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

    if (!_.isEmpty(r.style)) {
      attrs.auto_style_definition = r.style.auto_style.definition;
      attrs.auto_style_allowed = r.style.auto_style.allowed;
      attrs.widget_style_definition = r.style.widget_style.definition;
    }

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
    o.options = _.omit(this.attributes, ATTRS_AT_TOP_LEVEL, STYLE_PROPERTIES);

    if (this.get('widget_style_definition')) {
      o.style = {
        auto_style: {
          definition: this.get('auto_style_definition'),
          custom: !!this.get('auto_style_definition'),
          allowed: this.get('auto_style_allowed')
        },
        widget_style: {
          definition: this.get('widget_style_definition')
        }
      }
    }

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
        ['sync_on_data_change', 'sync_on_bbox_change'].concat(ATTRS_AT_TOP_LEVEL, STYLE_PROPERTIES),
        _.keys(attrsForNewType)
      )
      .each(function (key) {
        this.unset(key, { silent: true });
      }, this);

    this.set(attrsForNewType);
  },

  containsNode: function (otherNodeDefModel) {
    if (!otherNodeDefModel) return false;

    var sourceId = this.get('source');
    var nodeDefModel = otherNodeDefModel.collection.get(sourceId);

    return !!(sourceId === otherNodeDefModel.id ||
      nodeDefModel && nodeDefModel.containsNode(otherNodeDefModel));
  }

}, {
  getDefaultWidgetStyle: function () {
    return WIDGET_STYLE;
  },
  getDefaultAutoStyle: function (type) {
    return AUTO_STYLE[type];
  }
});
