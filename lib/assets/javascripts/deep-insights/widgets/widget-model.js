var _ = require('underscore');
var cdb = require('@carto/carto.js');
var AutoStylerFactory = require('./auto-style/factory');

var TIME_SERIES_TYPE = 'time-series';
var HISTOGRAM_TYPE = 'histogram';

/**
 * Default widget model
 *
 * Note: Currently all widgets have a dependency on a dataview, why it makes sense to have it here.
 * If you need a widget model that's backed up by a dataview model please implement your own model and adhere to the
 * public interface instead of extending/hacking this one.
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    attrsNames: [],
    show_stats: false,
    show_source: false
  },

  defaultState: {
    'collapsed': false
  },

  initialize: function (attrs, models, opts) {
    opts = opts || {};
    if (!models.dataviewModel) throw new Error('dataviewModel is required.');
    if (!models.layerModel) throw new Error('layerModel is required.');

    this.dataviewModel = models.dataviewModel;
    this.layerModel = models.layerModel;
    this.set('layerColumns', []);

    // Autostyle could be disabled initially if the styles have an aggregation
    // If no option, autoStyleEnabled by default
    this._autoStyleEnabledWhenCreated = opts.autoStyleEnabled === undefined ? true : opts.autoStyleEnabled;

    this.activeAutoStyler();
    this.listenTo(this, 'change:style', this.activeAutoStyler);
    this.listenTo(this, 'change:configModel', this.fetchLayerColumns);
    this.listenTo(this.layerModel, 'change', this.fetchLayerColumns);
  },

  setLayerColumns: function (layerColumns) {
    this.set('layerColumns', layerColumns);
  },

  /**
   * Use the sql api to get the list of columns availiable in the layer
   */
  fetchLayerColumns: function () {
    this._getColumnNames().then(function (layerColumns) {
      this.setLayerColumns(layerColumns);
      this.activeAutoStyler();
      this.trigger('columnsUpdated');
    }.bind(this));
  },

  /**
   * Get the columns in the analysis to check if the autostyle can be applied
   * Notice this might fail with custom sql sources where some columns are removed.
   * We need to wait for the configModel to be set by the widgets-integration
   */
  _getColumnNames: function () {
    if (!this.has('configModel')) {
      return Promise.resolve([]);
    }
    var tableName = this.layerModel.getTableName();
    var apiKey = this.layerModel.getApiKey();
    var sqlApiUrl = this.get('configModel').getSqlApiUrl();
    if (!tableName) {
      return Promise.resolve([]);
    }

    var apiKeyParam = apiKey ? '&api_key=' + apiKey : '';
    var url = sqlApiUrl + '?q=' + encodeURIComponent('SELECT * from ' + tableName) + apiKeyParam;

    return fetch(url)
      .then(function (response) { return response.json(); })
      .then(function (jsonResponse) { return Object.keys(jsonResponse.fields); });
  },

  activeAutoStyler: function () {
    if (this.isAutoStyleEnabled() && !this.autoStyler) {
      this.autoStyler = AutoStylerFactory.get(this.dataviewModel, this.layerModel, this.get('style'));
    }
  },

  /**
   * @public
   * @param {Object} attrs, not that it should be
   * @return {Boolean} true if at least one attribute was changed
   * @throws {Error} Should throw an error if the attrs are invalid or inconsistent
   */
  update: function (attrs) {
    var wAttrs = _.pick(attrs, this.get('attrsNames'));
    this.set(wAttrs);
    this.dataviewModel.update(attrs);
    this._triggerChangesInAutoStyle();
    return !!(this.changedAttributes() || this.dataviewModel.changedAttributes());
  },

  _triggerChangesInAutoStyle: function () {
    var changed = this.changed && this.changed.style && this.changed.style.auto_style && this.changed.style.auto_style.definition;
    var previous = this.previousAttributes();
    var former = previous.style && previous.style.auto_style && previous.style.auto_style.definition;

    if (!_.isEqual(changed, former)) {
      this.trigger('customAutoStyle', this);
    }
  },

  /**
   * @public
   */
  remove: function () {
    this.dataviewModel.remove();
    this.trigger('destroy', this);
    this.stopListening();
  },

  isAutoStyleEnabled: function () {
    if (!this._modelHasRequiredColumns()) {
      return false;
    }

    var styles = this.get('style');
    if (this.get('type') === 'category' || this.get('type') === 'histogram') {
      if (!styles || !styles.auto_style) {
        // Only when styles are undefined we check the autostyle option
        return this._autoStyleEnabledWhenCreated;
      }

      return styles && styles.auto_style && styles.auto_style.allowed;
    }
    return false;
  },

  _modelHasRequiredColumns: function () {
    return this.get('layerColumns').indexOf(this.dataviewModel.get('column')) >= 0;
  },

  getWidgetColor: function () {
    var styles = this.get('style');
    var widgetStyle = styles && styles.widget_style;
    var widgetColor = widgetStyle && widgetStyle.definition &&
      widgetStyle.definition.color &&
      widgetStyle.definition.color.fixed;
    var widgetColorChanged = (widgetStyle && widgetStyle.widget_color_changed) ||
      (widgetStyle && !widgetStyle.widget_color_changed && widgetColor !== '#9DE0AD');

    return widgetColorChanged && widgetColor;
  },

  hasColorsAutoStyle: function () {
    var autoStyle = this.getAutoStyle();
    var hasDefinedColors = false;

    if (!autoStyle || _.isEmpty(autoStyle) || _.isEmpty(autoStyle.definition)) {
      return false;
    }

    // Check colors in all geometries
    _.each(autoStyle.definition, function (geometryStyle) {
      if (geometryStyle.color && geometryStyle.color.range && geometryStyle.color.range.length > 0) {
        hasDefinedColors = true;
      }
    }, this);

    return hasDefinedColors;
  },

  getColor: function (name) {
    if (this.isAutoStyleEnabled() && this.isAutoStyle() && this.get('type') === 'category') {
      return this.autoStyler.colors.getColorByCategory(name);
    } else {
      return this.getWidgetColor();
    }
  },

  isAutoStyle: function () {
    return this.get('autoStyle');
  },

  autoStyle: function () {
    if (!this.isAutoStyleEnabled()) return;
    if (!this.dataForAutoStyle()) return;

    var layer = this.layerModel;
    var initialStyle = layer.get('cartocss');
    if (!initialStyle && layer.get('meta')) {
      initialStyle = layer.get('meta').cartocss;
    }
    layer.set('initialStyle', initialStyle);

    var style = this.autoStyler.getStyle();
    layer.set('cartocss', style);
    this.set('autoStyle', true);
  },

  dataForAutoStyle: function () {
    return this.dataviewModel.get('data').length > 0;
  },

  reapplyAutoStyle: function () {
    var style = this.autoStyler.getStyle();
    this.layerModel.set('cartocss', style);
    this.set('autoStyle', true);
  },

  cancelAutoStyle: function (noRestore) {
    if (!noRestore) {
      this.layerModel.restoreCartoCSS();
    }
    this.set('autoStyle', false);
  },

  getAutoStyle: function () {
    var style = this.get('style');
    var layerModel = this.layerModel;
    var cartocss = layerModel.get('cartocss') || (layerModel.get('meta') && layerModel.get('meta').cartocss);

    if (this.isAutoStyleEnabled() && this.autoStyler) {
      if (style && style.auto_style && style.auto_style.definition) {
        var toRet = _.extend(style.auto_style, { cartocss: cartocss });
        return _.extend({}, toRet, { definition: this.autoStyler.getDef(cartocss) });
      } else {
        return {
          definition: this.autoStyler.getDef(cartocss),
          cartocss: cartocss
        };
      }
    }

    return {};
  },

  _updateAutoStyle: function (_model, style) {
    if (this.autoStyler) {
      this.autoStyler.updateStyle(style);
    }
    if (this.isAutoStyle()) {
      this.reapplyAutoStyle();
    }
  },

  setInitialState: function (state) {
    this.initialState = state || {};
  },

  applyInitialState: function () {
    var attrs = _.extend(
      this.initialState,
      { hasInitialState: true }
    );

    this.setState(attrs);
  },

  setState: function (state) {
    this.set(state);
  },

  getState: function () {
    var state = {};
    for (var key in this.defaultState) {
      var attribute = this.get(key);
      var defaultValue = this.defaultState[key];
      if (typeof defaultValue !== 'undefined' && typeof attribute !== 'undefined' && !_.isEqual(attribute, defaultValue)) {
        state[key] = attribute;
      }
    }
    return state;
  },

  forceResize: function () {
    var type = this.get('type');
    if (type === TIME_SERIES_TYPE ||
      type === HISTOGRAM_TYPE) {
      this.trigger('forceResize');
    }
  }
});
