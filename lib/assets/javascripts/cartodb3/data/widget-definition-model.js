var _ = require('underscore');
var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');
var CartoColor = require('cartocolor');

var ATTRS_AT_TOP_LEVEL = ['id', 'layer_id', 'source', 'title', 'type', 'order'];
var STYLE_PROPERTIES = ['widget_style_definition', 'auto_style_definition', 'auto_style_allowed'];

var DEFAULT_WIDGET_COLOR = '#9DE0AD';
var DEFAULT_WIDGET_STYLE = {
  color: {
    fixed: DEFAULT_WIDGET_COLOR,
    opacity: 1
  }
};

var getDefaultCategoriesByRange = function (range) {
  var widgetDomain = [];
  for (var i = 0, l = range.length; i < l; i++) {
    widgetDomain.push(_t('form-components.editors.fill.quantification.methods.category') + ' #' + (i + 1));
  }
  return widgetDomain;
};

/**
 * Widget definition Model
 */
module.exports = Backbone.Model.extend({
  defaults: {
    sync_on_data_change: true,
    sync_on_bbox_change: true,
    auto_style_allowed: true,
    widget_style_definition: DEFAULT_WIDGET_STYLE
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
      var style = r.style;
      if (style.auto_style) {
        var autoStyle = style.auto_style;
        var autoStyleDefinition = autoStyle.definition;
        if (autoStyleDefinition && autoStyleDefinition.color && autoStyleDefinition.color.quantification === 'category') {
          autoStyleDefinition.color.domain = getDefaultCategoriesByRange(autoStyleDefinition.color.range);
        }
        attrs.auto_style_definition = autoStyle.definition;
        attrs.auto_style_allowed = autoStyle.allowed;
      }
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
        widget_style: {
          definition: this.get('widget_style_definition')
        }
      };

      o.style.auto_style = {
        custom: !!this.get('auto_style_definition'),
        allowed: this.get('auto_style_allowed')
      };

      if (this.get('auto_style_definition')) {
        var autoStyleDefinition = this.get('auto_style_definition');
        autoStyleDefinition.color = _.omit(autoStyleDefinition.color, 'domain', 'bins');
        o.style.auto_style.definition = autoStyleDefinition;
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

  getDefaultWidgetStyle: function (type) {
    var widgetColor = type === 'time-series' ? '#F2CC8F' : DEFAULT_WIDGET_COLOR;
    var defaultWidgetStyle = DEFAULT_WIDGET_STYLE;
    defaultWidgetStyle.color.fixed = widgetColor;
    return defaultWidgetStyle;
  },

  getDefaultAutoStyle: function (type, columnName) {
    var defaultWidgetCategories = 10;
    var defaultWidgetRampSize = 7;
    var widgetRamp = _.first(
      _.compact(
        _.map(CartoColor, function (ramp) {
          return _.clone(ramp[defaultWidgetRampSize]);
        }, this)
      )
    );
    var widgetCategories = _.clone(CartoColor.Prism[defaultWidgetCategories]);
    var widgetRange = type === 'category' ? widgetCategories : widgetRamp;
    var widgetQuantification = type === 'category' ? 'category' : 'quantiles';

    var attrs = {
      color: {
        attribute: columnName,
        quantification: widgetQuantification,
        range: widgetRange
      }
    };

    if (type === 'category') {
      attrs.color.domain = getDefaultCategoriesByRange(widgetCategories);
    } else {
      attrs.color.bins = type === 'time-series' ? 256 : defaultWidgetRampSize;
    }

    return attrs;
  }
});
